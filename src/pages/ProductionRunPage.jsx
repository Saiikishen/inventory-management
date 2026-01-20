import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Modal from 'react-modal';
import './ProductionRunPage.css';

Modal.setAppElement('#root');

const ProductionRunPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [productionQuantity, setProductionQuantity] = useState(1);
    const [stockCheckResult, setStockCheckResult] = useState(null);
    const [isStockAvailable, setIsStockAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    // New state for the force production feature
    const [isForceModalOpen, setIsForceModalOpen] = useState(false);
    const [insufficientStockItems, setInsufficientStockItems] = useState([]);

    useEffect(() => {
        const fetchProject = async () => {
            if (projectId) {
                try {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        setProject({ ...projectDoc.data(), id: projectDoc.id });
                    } else {
                        setSnackbar({ open: true, message: 'Project not found.', type: 'error' });
                    }
                } catch (error) {
                    console.error("Error fetching project:", error);
                    setSnackbar({ open: true, message: 'Error fetching project data.', type: 'error' });
                }
            }
        };
        fetchProject();
    }, [projectId]);

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => {
        setModalIsOpen(false);
        setStockCheckResult(null);
        setProductionQuantity(1);
        setIsStockAvailable(false);
        setInsufficientStockItems([]);
    };

    const handleStockCheck = async () => {
        if (!project || productionQuantity <= 0) return;
        setIsLoading(true);
        setStockCheckResult(null);
        const bomData = project.bom;
        if (!bomData || bomData.length === 0) {
            setSnackbar({ open: true, message: 'This project has no Bill of Materials (BOM).', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const stockCheck = await Promise.all(bomData.map(async (item) => {
                const requiredQuantity = item.quantity * productionQuantity;
                const componentDoc = await getDoc(doc(db, 'components', item.componentId));
                if (!componentDoc.exists()) {
                    return { ...item, requiredQuantity, availableStock: 0, hasEnoughStock: false, error: 'Component not found' };
                }
                const componentData = componentDoc.data();
                if (!componentData.locations || !Array.isArray(componentData.locations)) {
                    return { ...item, requiredQuantity, availableStock: 0, hasEnoughStock: false, error: 'Component missing location data' };
                }
                const location = componentData.locations.find(l => l.id === item.locationId);
                const stockAtLocation = location?.stock || 0;
                return {
                    ...item,
                    requiredQuantity,
                    availableStock: stockAtLocation,
                    locationName: location?.name || 'Unknown Location',
                    hasEnoughStock: stockAtLocation >= requiredQuantity,
                    componentRef: componentDoc.ref
                };
            }));

            const allInStock = stockCheck.every(item => item.hasEnoughStock && !item.error);
            setStockCheckResult(stockCheck);
            setIsStockAvailable(allInStock);
            setInsufficientStockItems(stockCheck.filter(item => !item.hasEnoughStock && !item.error));
        } catch (error) {
            console.error("Error performing stock check:", error);
            setSnackbar({ open: true, message: 'An error occurred during stock check.', type: 'error' });
        }
        setIsLoading(false);
    };

    const executeProductionRun = async (force = false) => {
        if (!force && (!stockCheckResult || !isStockAvailable)) {
            setSnackbar({ open: true, message: 'Cannot execute run. Stock not available.', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const batch = writeBatch(db);

            for (const item of stockCheckResult) {
                if (item.error) continue;

                const componentSnapshot = await getDoc(item.componentRef);
                const componentData = componentSnapshot.data();

                const newLocations = componentData.locations.map(location => {
                    if (location.id === item.locationId) {
                        if (force && !item.hasEnoughStock) {
                            return { ...location, stock: 0 }; // Force production sets stock to 0
                        }
                        return { ...location, stock: location.stock - item.requiredQuantity };
                    }
                    return location;
                });
                batch.update(item.componentRef, { locations: newLocations });
            }

            const transactionDetails = [
                `Project: ${project.name}`,
                `Quantity Produced: ${productionQuantity}`,
                force ? 'Components Used (FORCED RUN):' : 'Components Used:',
                ...stockCheckResult.map(item => {
                    if (force && !item.hasEnoughStock) {
                        return `- ${item.name || item.componentId}: Used ${item.availableStock} from ${item.locationName} (Forced). Stock set to 0.`;
                    }
                    return `- ${item.name || item.componentId}: Used ${item.requiredQuantity} from ${item.locationName}`;
                })
            ];

            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, { type: 'Production Run', timestamp: Timestamp.now(), details: transactionDetails });

            await batch.commit();
            setSnackbar({ open: true, message: 'Production run executed successfully!', type: 'success' });
            closeModal();
            setIsForceModalOpen(false);
        } catch (error) {
            console.error("Error executing production run:", error);
            setSnackbar({ open: true, message: `Failed to execute production run: ${error.message}`, type: 'error' });
        }
        setIsLoading(false);
    };
    
    const handleCloseSnackbar = () => setSnackbar({ open: false, message: '', type: snackbar.type });

    return (
        <div className="production-run-page-container">
            {project ? (
                <>
                    <h1>Production Run for: {project.name}</h1>
                    <button onClick={openModal} className="create-run-button">Create Production Run</button>

                    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Production Run" className="modal" overlayClassName="overlay">
                        <h2>Create Production Run</h2>
                        <div className="form-group">
                            <label htmlFor="quantity">Production Quantity:</label>
                            <input id="quantity" type="number" value={productionQuantity} onChange={(e) => setProductionQuantity(Math.max(1, parseInt(e.target.value, 10)))} min="1" />
                        </div>
                        <button onClick={handleStockCheck} className="run-button" disabled={isLoading}>{isLoading ? 'Checking...' : 'Check Stock'}</button>
                        <button onClick={closeModal} className="cancel-button">Close</button>
                        
                        {stockCheckResult && (
                            <div className="stock-check-results">
                                <h3>Stock Check Results</h3>
                                <table>
                                    <thead><tr><th>Component</th><th>Location</th><th>Required</th><th>Available</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {stockCheckResult.map((item, index) => (
                                            <tr key={index} className={!item.hasEnoughStock && !item.error ? 'out-of-stock-row' : ''}>
                                                <td>{item.name || item.componentId}</td>
                                                <td>{item.locationName || '-'}</td>
                                                <td>{item.requiredQuantity}</td>
                                                <td>{item.availableStock}</td>
                                                <td>
                                                    {item.error ? <span className="status-error">{item.error}</span> : 
                                                     item.hasEnoughStock ? <span className="status-ok">In Stock</span> : <span className="status-error">Out of Stock</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {isStockAvailable && !isLoading && (
                                    <button onClick={() => executeProductionRun()} className="execute-run-button">Execute Production Run</button>
                                )}
                                {!isStockAvailable && insufficientStockItems.length > 0 && !isLoading && (
                                    <button onClick={() => setIsForceModalOpen(true)} className="force-run-button">Force Production Run</button>
                                )}
                            </div>
                        )}
                    </Modal>

                    <Modal isOpen={isForceModalOpen} onRequestClose={() => setIsForceModalOpen(false)} contentLabel="Force Production Confirmation" className="modal" overlayClassName="overlay">
                        <h2>Insufficient Stock</h2>
                        <p>The following components have insufficient stock. Proceeding will use all available stock and set the quantity to 0.</p>
                        <table className="component-table">
                            <thead><tr><th>Component</th><th>Required</th><th>Available</th><th>Need to Order</th></tr></thead>
                            <tbody>
                                {insufficientStockItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name || item.componentId}</td>
                                        <td>{item.requiredQuantity}</td>
                                        <td>{item.availableStock}</td>
                                        <td>{item.requiredQuantity - item.availableStock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={() => executeProductionRun(true)} className="run-button">Confirm & Proceed</button>
                        <button onClick={() => setIsForceModalOpen(false)} className="cancel-button">Cancel</button>
                    </Modal>
                </>
            ) : <h1>{projectId ? 'Loading project...' : 'Select a project to start a production run.'}</h1>}
            
            {snackbar.open && (
                <div className={`snackbar ${snackbar.type}`}>{snackbar.message}<button onClick={handleCloseSnackbar}>X</button></div>
            )}
        </div>
    );
};

export default ProductionRunPage;
