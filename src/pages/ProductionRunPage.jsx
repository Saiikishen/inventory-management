import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Modal from 'react-modal';
import './ProductionRunPage.css';
import StockCheckResult from '../components/StockCheckResult';

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
    const [isForceModalOpen, setIsForceModalOpen] = useState(false);
    const [insufficientStockItems, setInsufficientStockItems] = useState([]);
    const [isStockCheckModalOpen, setIsStockCheckModalOpen] = useState(false);
    const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [partNumber, setPartNumber] = useState('');
    const [productionRunType, setProductionRunType] = useState(null);

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
        setIsLoading(true);
        const quantity = parseInt(productionQuantity, 10);

        if (!project || !productionQuantity || isNaN(quantity) || quantity <= 0) {
            setSnackbar({ open: true, message: 'Please enter a valid quantity.', type: 'error' });
            setIsLoading(false);
            return;
        }

        setStockCheckResult(null);
        const bomData = project.bom;
        if (!bomData || bomData.length === 0) {
            setSnackbar({ open: true, message: 'This project has no Bill of Materials (BOM).', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const stockCheck = await Promise.all(bomData.map(async (item) => {
                const requiredQuantity = item.quantity * quantity;
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
            setModalIsOpen(false);
            setIsStockCheckModalOpen(true);
        } catch (error) {
            console.error("Error performing stock check:", error);
            setSnackbar({ open: true, message: 'An error occurred during stock check.', type: 'error' });
        }
        setIsLoading(false);
    };

    const openRemarksModal = (type) => {
        setProductionRunType(type);
        setIsRemarksModalOpen(true);
        setIsStockCheckModalOpen(false);
        setIsForceModalOpen(false);
    };

    const handleConfirmRemarks = () => {
        if (productionRunType === 'force') {
            executeProductionRun(true, remarks, partNumber);
        } else {
            executeProductionRun(false, remarks, partNumber);
        }
        setIsRemarksModalOpen(false);
        setRemarks('');
        setPartNumber('');
    };

    const executeProductionRun = async (force = false, remarks = '', partNumber = '') => {
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
                            return { ...location, stock: 0 };
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
                `Part Number: ${partNumber}`,
                `Remarks: ${remarks}`,
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
            setIsStockCheckModalOpen(false);
            setIsForceModalOpen(false);
        } catch (error) {
            console.error("Error executing production run:", error);
            setSnackbar({ open: true, message: `Failed to execute production run: ${error.message}`, type: 'error' });
        }
        setIsLoading(false);
    };
    
    const handleCloseSnackbar = () => setSnackbar({ open: false, message: '', type: snackbar.type });

    const openForceModal = () => {
        setIsStockCheckModalOpen(false);
        setIsForceModalOpen(true);
    }

    return (
        <div className="production-run-page-container">
            {project ? (
                <>
                    <h1>Production Run for: {project.name}</h1>
                    <button onClick={openModal} className="create-run-button">Create Production Run</button>

                    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Production Run" className="modal" overlayClassName="overlay">
                        <div className="stock-check-header">Create Production Run</div>
                        <div className="stock-check-body">
                            <div className="form-group">
                                <label htmlFor="quantity">Production Quantity:</label>
                                <input id="quantity" type="number" value={productionQuantity} onChange={(e) => setProductionQuantity(e.target.value)} min="1" />
                            </div>
                        </div>
                        <div className="stock-check-actions">
                            <button onClick={handleStockCheck} className="run-button" disabled={isLoading}>{isLoading ? 'Checking...' : 'Check Stock'}</button>
                            <button onClick={closeModal} className="cancel-button">Close</button>
                        </div>
                    </Modal>

                    <StockCheckResult 
                        isOpen={isStockCheckModalOpen}
                        onRequestClose={() => setIsStockCheckModalOpen(false)}
                        stockCheckResult={stockCheckResult}
                        isStockAvailable={isStockAvailable}
                        isLoading={isLoading}
                        executeProductionRun={() => openRemarksModal('normal')}
                        openForceModal={openForceModal}
                    />

                    <Modal isOpen={isForceModalOpen} onRequestClose={() => setIsForceModalOpen(false)} contentLabel="Force Production Confirmation" className="stock-check-modal" overlayClassName="stock-check-overlay">
                        <div className="stock-check-header">Insufficient Stock</div>
                        <div className="stock-check-body">
                            <p>The following components have insufficient stock. Proceeding will use all available stock and set the quantity to 0.</p>
                            <table className="component-table stock-check-table">
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
                        </div>
                        <div className="stock-check-actions">
                            <button onClick={() => openRemarksModal('force')} className="run-button">Confirm & Proceed</button>
                            <button onClick={() => { setIsForceModalOpen(false); setIsStockCheckModalOpen(true);}} className="cancel-button">Cancel</button>
                        </div>
                    </Modal>

                    <Modal isOpen={isRemarksModalOpen} onRequestClose={() => setIsRemarksModalOpen(false)} contentLabel="Production Run Remarks" className="modal" overlayClassName="overlay">
                        <div className="stock-check-header">Production Run Details</div>
                        <div className="stock-check-body">
                            <div className="form-group">
                                <label htmlFor="partNumber">Part Number:</label>
                                <input id="partNumber" type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="remarks">Remarks:</label>
                                <textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                            </div>
                        </div>
                        <div className="stock-check-actions">
                            <button onClick={handleConfirmRemarks} className="run-button">Confirm Production Run</button>
                            <button onClick={() => setIsRemarksModalOpen(false)} className="cancel-button">Cancel</button>
                        </div>
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