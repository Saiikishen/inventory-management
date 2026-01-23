import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import './ComponentList.css';

Modal.setAppElement('#root');

const ComponentList = () => {
    const [components, setComponents] = useState([]);
    const [newComponent, setNewComponent] = useState({
        name: '', category: '', value: '', footprint: '',
        toleranceRating: '', manufacturer: '', manufacturerPartNo: '', pricing: '',
        initialStock: '', stockLocationId: ''
    });
    const [stockLocations, setStockLocations] = useState([]);
    const [showNewLocationInput, setShowNewLocationInput] = useState(false);
    const [showRemoveLocationUI, setShowRemoveLocationUI] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');
    const [editingComponentId, setEditingComponentId] = useState(null);
    const [editedComponentData, setEditedComponentData] = useState({ locations: [], pricing: '', manufacturer: '', manufacturerPartNo: '' });

    // State for the new "Add Stock" modal
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [addStockData, setAddStockData] = useState({ locationId: '', quantity: 0 });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribeComponents = onSnapshot(collection(db, 'components'), (snapshot) => {
            const componentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setComponents(componentsData);
        });

        const unsubscribeLocations = onSnapshot(collection(db, 'stock_locations'), (snapshot) => {
            const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setStockLocations(locationsData);
        });

        return () => {
            unsubscribeComponents();
            unsubscribeLocations();
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'stockLocationId' && value === 'add-new') {
            setShowNewLocationInput(true);
            setShowRemoveLocationUI(false);
        } else if (name === 'stockLocationId' && value === 'remove-location') {
            setShowRemoveLocationUI(true);
            setShowNewLocationInput(false);
        } else if (name === 'category') {
            setNewComponent(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setNewComponent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveNewLocation = async () => {
        if (!newLocationName) {
            setSnackbar({ open: true, message: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'stock_locations'), { name: newLocationName });
            setNewComponent(prev => ({ ...prev, stockLocationId: docRef.id }));
            setShowNewLocationInput(false);
            setNewLocationName('');
            setSnackbar({ open: true, message: 'Location added successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding location: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteLocation = async (id) => {
        try {
            await deleteDoc(doc(db, 'stock_locations', id));
            setSnackbar({ open: true, message: 'Location deleted successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error deleting location: ${error.message}`, type: 'error' });
        }
    };

    const handleAddComponent = async () => {
        const { name, category, value, footprint, toleranceRating, manufacturer, manufacturerPartNo, pricing, initialStock, stockLocationId } = newComponent;
        if (!name || !category || !stockLocationId) {
            setSnackbar({ open: true, message: 'Category, Name, and Stock Location are required.', type: 'error' });
            return;
        }
        const componentId = [category, name, value, footprint, toleranceRating].filter(Boolean).join('-').toUpperCase();
        
        const componentRef = doc(db, 'components', componentId);
        const docSnap = await getDoc(componentRef);

        if (docSnap.exists()) {
            setSnackbar({ open: true, message: 'Component already exists.', type: 'error' });
            return;
        }

        const stock = parseInt(initialStock, 10) || 0;
        try {
            const location = stockLocations.find(loc => loc.id === stockLocationId);
            const newComponentData = {
                name, category, value, footprint, toleranceRating, manufacturer, manufacturerPartNo, pricing,
                createdAt: new Date(),
                locations: [{ id: stockLocationId, name: location.name, stock: stock }]
            };
            await setDoc(componentRef, newComponentData);

            // Log the transaction
            const transactionDetails = `Component: ${name} (ID: ${componentId}), Quantity: ${stock}, Location: ${location.name}, Description: Initial stock for new component`;
            await addDoc(collection(db, "transactions"), {
                type: 'Component Creation',
                details: [transactionDetails],
                timestamp: serverTimestamp()
            });

            setNewComponent({ name: '', category: '', value: '', footprint: '', toleranceRating: '', manufacturer: '', manufacturerPartNo: '', pricing: '', initialStock: '', stockLocationId: '' });
            setSnackbar({ open: true, message: 'Component added successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding component: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteComponent = async (id) => {
        try {
            await deleteDoc(doc(db, 'components', id));
            setSnackbar({ open: true, message: 'Component deleted successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error deleting component: ${error.message}`, type: 'error' });
        }
    };

    const handleEditClick = (component) => {
        setEditingComponentId(component.id);
        setEditedComponentData({
            locations: component.locations || [],
            pricing: component.pricing || '',
            manufacturer: component.manufacturer || '',
            manufacturerPartNo: component.manufacturerPartNo || ''
        });
    };

    const handleCancelEdit = () => setEditingComponentId(null);

    const handleUpdateComponent = async () => {
        if (!editingComponentId) return;
        try {
            const componentRef = doc(db, 'components', editingComponentId);
            await updateDoc(componentRef, {
                pricing: editedComponentData.pricing,
                manufacturer: editedComponentData.manufacturer,
                manufacturerPartNo: editedComponentData.manufacturerPartNo
            });
            setSnackbar({ open: true, message: 'Component updated successfully!', type: 'success' });
            handleCancelEdit();
        } catch (error) {
            setSnackbar({ open: true, message: `Error updating component: ${error.message}`, type: 'error' });
        }
    };

    // --- Functions for the new "Add Stock" feature ---
    const openAddStockModal = (component) => {
        setSelectedComponent(component);
        setIsAddStockModalOpen(true);
    };

    const closeAddStockModal = () => {
        setIsAddStockModalOpen(false);
        setSelectedComponent(null);
        setAddStockData({ locationId: '', quantity: 0 });
    };

    const handleAddStock = async () => {
        const { locationId, quantity } = addStockData;
        const stockToAdd = parseInt(quantity, 10) || 0;

        if (!locationId || !selectedComponent || stockToAdd <= 0) {
            setSnackbar({ open: true, message: 'Please select a location and enter a valid quantity.', type: 'error' });
            return;
        }

        const componentRef = doc(db, 'components', selectedComponent.id);
        const currentLocations = selectedComponent.locations || [];
        const locationExists = currentLocations.some(loc => loc.id === locationId);
        let newLocations;

        if (locationExists) {
            newLocations = currentLocations.map(loc =>
                loc.id === locationId ? { ...loc, stock: (loc.stock || 0) + stockToAdd } : loc
            );
        } else {
            const location = stockLocations.find(loc => loc.id === locationId);
            newLocations = [...currentLocations, { id: locationId, name: location.name, stock: stockToAdd }];
        }

        try {
            await updateDoc(componentRef, { locations: newLocations });
            // Log the transaction
            const location = stockLocations.find(loc => loc.id === locationId);
            const transactionDetails = `Component: ${selectedComponent.name} (ID: ${selectedComponent.id}), Quantity: ${stockToAdd}, Location: ${location.name}, Description: Added stock`;
            await addDoc(collection(db, "transactions"), {
                type: 'Stock Addition',
                details: [transactionDetails],
                timestamp: serverTimestamp()
            });

            setSnackbar({ open: true, message: 'Stock added successfully!', type: 'success' });
            closeAddStockModal();
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding stock: ${error.message}`, type: 'error' });
        }
    };

    const handleCloseSnackbar = () => setSnackbar({ open: false, message: '', type: snackbar.type });

    const renderManufacturerLinks = (manufacturer) => {
        if (!manufacturer) return null;
        return manufacturer.split(',').map((link, index) => {
            const trimmedLink = link.trim();
            let domain = '';
            try { domain = new URL(trimmedLink).hostname; } catch { domain = trimmedLink; }
            return <a key={index} href={trimmedLink} target="_blank" rel="noopener noreferrer">{domain}</a>;
        }).reduce((prev, curr) => [prev, ', ', curr]);
    };

    return (
        <div className="component-list-container">
            <h1>Manage Components</h1>
            <div className="add-component-form">
                <input type="text" name="category" value={newComponent.category} onChange={handleInputChange} placeholder="Category *" />
                <input type="text" name="name" value={newComponent.name} onChange={handleInputChange} placeholder="Name *" />
                <input type="text" name="value" value={newComponent.value} onChange={handleInputChange} placeholder="Value" />
                <input type="text" name="footprint" value={newComponent.footprint} onChange={handleInputChange} placeholder="Footprint" />
                <input type="text" name="toleranceRating" value={newComponent.toleranceRating} onChange={handleInputChange} placeholder="Tolerance" />
                <input type="text" name="manufacturer" value={newComponent.manufacturer} onChange={handleInputChange} placeholder="Manufacturer Links" />
                <input type="text" name="manufacturerPartNo" value={newComponent.manufacturerPartNo} onChange={handleInputChange} placeholder="Manufacturer Part No:" />
                <input type="number" name="pricing" value={newComponent.pricing} onChange={handleInputChange} placeholder="Pricing" />
                <input type="number" name="initialStock" value={newComponent.initialStock} onChange={handleInputChange} placeholder="Initial Stock" />
                <select name="stockLocationId" value={newComponent.stockLocationId} onChange={handleInputChange}>
                    <option value="">Select Location *</option>
                    {stockLocations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                    <option value="add-new">Add new location...</option>
                    <option value="remove-location">Remove a location...</option>
                </select>
                {showNewLocationInput && (
                    <div className="new-location-input-container">
                        <input type="text" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="New Location Name" />
                        <button onClick={handleSaveNewLocation}>Save</button>
                    </div>
                )}
                 {showRemoveLocationUI && (
                    <div className="remove-location-ui">
                        <h3>Remove a Stock Location</h3>
                        <ul>
                            {stockLocations.map(location => (
                                <li key={location.id}>{location.name}<button onClick={() => handleDeleteLocation(location.id)}>Delete</button></li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="add-component-button-container">
                  <button onClick={handleAddComponent} className="add-component-button">Add Component</button>
                </div>
            </div>

            <table className="component-table">
                <thead>
                    <tr>
                        <th>Component ID</th>
                        <th>Locations (Stock)</th>
                        <th>Pricing</th>
                        <th>Manufacturer</th>
                        <th>Manufacturer Part No:</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {components.map((component) => (
                        <tr key={component.id}>
                            <td>{component.id}</td>
                            <td>
                                {(component.locations || []).map(loc => `${loc.name}: ${loc.stock}`).join(', ')}
                            </td>
                            <td>
                                {editingComponentId === component.id ?
                                 <input type="text" value={editedComponentData.pricing} onChange={(e) => setEditedComponentData({...editedComponentData, pricing: e.target.value})}/> :
                                 component.pricing}
                            </td>
                            <td>
                                {editingComponentId === component.id ?
                                 <input type="text" value={editedComponentData.manufacturer} onChange={(e) => setEditedComponentData({...editedComponentData, manufacturer: e.target.value})}/> :
                                 renderManufacturerLinks(component.manufacturer)}
                            </td>
                            <td>
                                {editingComponentId === component.id ?
                                 <input type="text" value={editedComponentData.manufacturerPartNo} onChange={(e) => setEditedComponentData({...editedComponentData, manufacturerPartNo: e.target.value})}/> :
                                 component.manufacturerPartNo}
                            </td>
                            <td>
                                {editingComponentId === component.id ? (
                                    <>
                                        <button className="action-button save-button" onClick={handleUpdateComponent}>Save</button>
                                        <button className="action-button cancel-button" onClick={handleCancelEdit}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="action-button add-stock-button" onClick={() => openAddStockModal(component)}>Add Stock</button>
                                        <button className="action-button edit-button" onClick={() => handleEditClick(component)}>Edit</button>
                                        <button className="action-button delete-button" onClick={() => handleDeleteComponent(component.id)}>Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Add Stock Modal */}
            <Modal isOpen={isAddStockModalOpen} onRequestClose={closeAddStockModal} contentLabel="Add Stock" className="modal" overlayClassName="overlay">
                <h2>Add Stock for {selectedComponent?.id}</h2>
                <div className="form-group">
                    <label htmlFor="stock-location">Location</label>
                    <select id="stock-location" value={addStockData.locationId} onChange={(e) => setAddStockData({...addStockData, locationId: e.target.value})}>
                        <option value="">Select a location</option>
                        {stockLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="stock-quantity">Quantity</label>
                    <input id="stock-quantity" type="number" value={addStockData.quantity} onChange={(e) => setAddStockData({...addStockData, quantity: e.target.value})} min="1"/>
                </div>
                <button onClick={handleAddStock} className="run-button">Add Stock</button>
                <button onClick={closeAddStockModal} className="cancel-button">Cancel</button>
            </Modal>

            {snackbar.open && (
                <div className={`snackbar ${snackbar.type}`}>
                    {snackbar.message}
                    <button onClick={handleCloseSnackbar}>X</button>
                </div>
            )}
        </div>
    );
};

export default ComponentList;
