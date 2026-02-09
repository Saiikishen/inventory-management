import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './ProjectDetailsPage.css';
import { Autocomplete, TextField } from '@mui/material';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [components, setComponents] = useState({});
    const [stockLocations, setStockLocations] = useState([]);
    const [bom, setBom] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [editingBomItem, setEditingBomItem] = useState({ index: null, quantity: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bomItemToDelete, setBomItemToDelete] = useState(null);

    useEffect(() => {
        const unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
            if (docSnap.exists()) {
                const projectData = { ...docSnap.data(), id: docSnap.id };
                setProject(projectData);
                setBom(projectData.bom || []);
            }
        });

        const unsubscribeComponents = onSnapshot(collection(db, 'components'), (snapshot) => {
            const componentsData = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = { ...doc.data(), id: doc.id };
                return acc;
            }, {});
            setComponents(componentsData);
        });

        const unsubscribeLocations = onSnapshot(collection(db, 'stock_locations'), (snapshot) => {
            const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setStockLocations(locationsData);
        });

        return () => {
            unsubscribeProject();
            unsubscribeComponents();
            unsubscribeLocations();
        };
    }, [projectId]);

    const handleAddComponentToBom = async () => {
        if (!selectedComponent || !selectedLocation) {
            setSnackbar({ open: true, message: 'Please select a component and location.', type: 'error' });
            return;
        }

        const isDuplicate = bom.some(item => item.componentId === selectedComponent.id);
        if (isDuplicate) {
            setSnackbar({ open: true, message: 'This component is already in the BOM.', type: 'error' });
            return;
        }

        const newBom = [
            ...bom,
            { componentId: selectedComponent.id, locationId: selectedLocation, quantity: 1 }
        ];

        try {
            await updateDoc(doc(db, 'projects', projectId), { bom: newBom });
            setSnackbar({ open: true, message: 'Component added to BOM!', type: 'success' });
            setSelectedComponent(null);
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding to BOM: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteBomItem = (index) => {
        setBomItemToDelete(index);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (bomItemToDelete !== null) {
            const newBom = [...bom];
            newBom.splice(bomItemToDelete, 1);
    
            try {
                await updateDoc(doc(db, 'projects', projectId), { bom: newBom });
                setSnackbar({ open: true, message: 'Component removed from BOM.', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error removing from BOM: ${error.message}`, type: 'error' });
            }
            setDeleteModalOpen(false);
            setBomItemToDelete(null);
        }
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setBomItemToDelete(null);
    };

    const handleEditClick = (index, quantity) => {
        setEditingBomItem({ index, quantity });
    };

    const handleCancelEdit = () => {
        setEditingBomItem({ index: null, quantity: '' });
    };

    const handleUpdateQuantity = async () => {
        const { index, quantity } = editingBomItem;
        const newBom = [...bom];
        newBom[index].quantity = parseInt(quantity, 10) || 0;

        try {
            await updateDoc(doc(db, 'projects', projectId), { bom: newBom });
            setSnackbar({ open: true, message: 'Quantity updated!', type: 'success' });
            handleCancelEdit();
        } catch (error) {
            setSnackbar({ open: true, message: `Error updating quantity: ${error.message}`, type: 'error' });
        }
    };

    const componentOptions = Object.values(components).map(component => ({
        label: `${component.name} (ID: ${component.id})`,
        id: component.id,
    }));

    const totalBomPrice = bom.reduce((total, item) => {
        const component = components[item.componentId];
        const unitPrice = component ? parseFloat(component.pricing) || 0 : 0;
        return total + (item.quantity * unitPrice);
    }, 0);

    const filteredBom = bom.filter(item => {
        const component = components[item.componentId];
        if (!component) return false;
        const searchText = searchTerm.toLowerCase();
        return (
            (item.componentId || '').toLowerCase().includes(searchText) ||
            (component.name || '').toLowerCase().includes(searchText) ||
            (component.manufacturerPartNo || '').toLowerCase().includes(searchText)
        );
    });

    return (
        <div className="project-details-page-container">
            {project ? (
                <>
                    <h1>{project.name} - Bill of Materials</h1>
                    <div className="total-price-container">
                        <h2>Total BOM Price: ₹{totalBomPrice.toFixed(2)}</h2>
                    </div>

                    <div className="add-to-bom-form">
                        <Autocomplete
                            options={componentOptions}
                            getOptionLabel={(option) => option.label}
                            style={{ width: 300 }}
                            value={selectedComponent}
                            onChange={(event, newValue) => {
                                setSelectedComponent(newValue);
                            }}
                            renderInput={(params) => <TextField {...params} label="Select Component" variant="outlined" />}
                        />

                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            <option value="">Select Location</option>
                            {stockLocations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>

                        <button onClick={handleAddComponentToBom}>Add to BOM</button>
                    </div>

                    <div className="search-bom-form">
                        <TextField
                            label="Search Component in BOM"
                            variant="outlined"
                            style={{ width: 300 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <table className="bom-table">
                        <thead>
                            <tr>
                                <th>Sl.No</th>
                                <th>Component ID</th>
                                <th>Manufacturer Part No:</th>
                                <th>Location</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBom.map((item, index) => {
                                const component = components[item.componentId];
                                const unitPrice = component ? parseFloat(component.pricing) || 0 : 0;
                                const totalPrice = (item.quantity * unitPrice).toFixed(2);
                                const originalBomIndex = bom.findIndex(bomItem => bomItem.componentId === item.componentId);

                                return (
                                    <tr key={item.componentId}>
                                        <td>{index + 1}</td>
                                        <td>{item.componentId}</td>
                                        <td>{component?.manufacturerPartNo}</td>
                                        <td>
                                            {stockLocations.find(loc => loc.id === item.locationId)?.name}
                                        </td>
                                        {editingBomItem.index === originalBomIndex ? (
                                            <td>
                                                <input
                                                    type="number"
                                                    value={editingBomItem.quantity}
                                                    onChange={(e) =>
                                                        setEditingBomItem({
                                                            ...editingBomItem,
                                                            quantity: e.target.value
                                                        })
                                                    }
                                                />
                                            </td>
                                        ) : (
                                            <td>{item.quantity}</td>
                                        )}
                                        <td>₹{unitPrice.toFixed(2)}</td>
                                        <td>₹{totalPrice}</td>
                                        <td>
                                            {editingBomItem.index === originalBomIndex ? (
                                                <>
                                                    <button className="action-button save-button" onClick={handleUpdateQuantity}>
                                                        Save
                                                    </button>
                                                    <button className="action-button cancel-button" onClick={handleCancelEdit}>
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="action-button edit-button"
                                                        onClick={() => handleEditClick(originalBomIndex, item.quantity)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="action-button delete-button"
                                                        onClick={() => handleDeleteBomItem(originalBomIndex)}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            ) : (
                <p>Loading project...</p>
            )}

            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this component from the BOM?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="delete-confirm-button">Delete</button>
                            <button onClick={closeDeleteModal} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {snackbar.open && (
                <div className={`snackbar ${snackbar.type}`}>
                    {snackbar.message}
                    <button onClick={() => setSnackbar({ ...snackbar, open: false })}>X</button>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailsPage;
