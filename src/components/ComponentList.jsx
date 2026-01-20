
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import './ComponentList.css';

const ComponentList = () => {
    const [components, setComponents] = useState([]);
    const [newComponent, setNewComponent] = useState({ 
        name: '', 
        category: '', 
        value: '', 
        footprint: '', 
        toleranceRating: '', 
        manufacturer: '',
        quantity: '',
        stockLocation: '',
        pricing: ''
    });
    const [stockLocations, setStockLocations] = useState([]);
    const [showNewLocationInput, setShowNewLocationInput] = useState(false);
    const [showRemoveLocationUI, setShowRemoveLocationUI] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');
    const [editingComponentId, setEditingComponentId] = useState(null);
    const [editedComponentData, setEditedComponentData] = useState({ quantity: '', pricing: '' });
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
        if (name === 'stockLocation' && value === 'add-new') {
            setShowNewLocationInput(true);
            setShowRemoveLocationUI(false);
        } else if (name === 'stockLocation' && value === 'remove-location') {
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
            setNewComponent(prev => ({ ...prev, stockLocation: docRef.id }));
            setShowNewLocationInput(false);
            setNewLocationName('');
            setSnackbar({ open: true, message: 'Location added successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding location: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteLocation = async (id) => {
        const isLocationInUse = components.some(component => component.stockLocation === id);
        if (isLocationInUse) {
            setSnackbar({ open: true, message: 'Cannot delete location as it is currently in use.', type: 'error' });
            return;
        }

        try {
            await deleteDoc(doc(db, 'stock_locations', id));
            setSnackbar({ open: true, message: 'Location deleted successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error deleting location: ${error.message}`, type: 'error' });
        }
    };

    const handleAddComponent = async () => {
        const { name, category, value, footprint, toleranceRating, quantity, stockLocation, pricing } = newComponent;
        if (!name || !category) {
            setSnackbar({ open: true, message: 'Category and Name are required.', type: 'error' });
            return;
        }

        const componentId = [category, name, value, footprint, toleranceRating].join('-').toUpperCase();
        const initialQuantity = parseInt(quantity, 10) || 0;

        try {
            await setDoc(doc(db, 'components', componentId), { ...newComponent, quantity: initialQuantity, createdAt: new Date() });
            setNewComponent({ name: '', category: '', value: '', footprint: '', toleranceRating: '', manufacturer: '', quantity: '', stockLocation: '', pricing: '' });
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
            quantity: component.quantity || 0,
            pricing: component.pricing || '' 
        });
    };

    const handleCancelEdit = () => {
        setEditingComponentId(null);
        setEditedComponentData({ quantity: '', pricing: '' });
    };

    const handleUpdateComponent = async () => {
        if (!editingComponentId) return;

        try {
            const componentRef = doc(db, 'components', editingComponentId);
            await updateDoc(componentRef, {
                quantity: parseInt(editedComponentData.quantity, 10) || 0,
                pricing: editedComponentData.pricing
            });

            setSnackbar({ open: true, message: 'Component updated successfully!', type: 'success' });
            handleCancelEdit();
        } catch (error) {
            setSnackbar({ open: true, message: `Error updating component: ${error.message}`, type: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ open: false, message: '', type: snackbar.type });
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
                <input type="text" name="manufacturer" value={newComponent.manufacturer} onChange={handleInputChange} placeholder="Manufacturer" />
                <input type="number" name="quantity" value={newComponent.quantity} onChange={handleInputChange} placeholder="Initial Quantity" />
                <input type="number" name="pricing" value={newComponent.pricing} onChange={handleInputChange} placeholder="Pricing" />
                <select name="stockLocation" value={newComponent.stockLocation} onChange={handleInputChange}>
                    <option value="">Select Location</option>
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
                                <li key={location.id}>
                                    {location.name}
                                    <button onClick={() => handleDeleteLocation(location.id)}>Delete</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={handleAddComponent}>Add Component</button>
            </div>

            <table className="component-table">
                <thead>
                    <tr>
                        <th>Component ID</th>
                        <th>Stock Location</th>
                        <th>Quantity</th>
                        <th>Pricing</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {components.map((component) => (
                        <tr key={component.id}>
                            <td>{component.id}</td>
                            <td>{stockLocations.find(loc => loc.id === component.stockLocation)?.name}</td>
                            {editingComponentId === component.id ? (
                                <>
                                    <td>
                                        <input
                                            type="number"
                                            value={editedComponentData.quantity}
                                            onChange={(e) => setEditedComponentData({ ...editedComponentData, quantity: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={editedComponentData.pricing}
                                            onChange={(e) => setEditedComponentData({ ...editedComponentData, pricing: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <button className="action-button edit-button" onClick={handleUpdateComponent}>Save</button>
                                        <button className="action-button cancel-button" onClick={handleCancelEdit}>Cancel</button>
                                    </td>
                                </> 
                            ) : (
                                <>
                                    <td>{component.quantity || 0}</td>
                                    <td>{component.pricing}</td>
                                    <td>
                                        <button className="action-button edit-button" onClick={() => handleEditClick(component)}>Edit</button>
                                        <button className="action-button delete-button" onClick={() => handleDeleteComponent(component.id)}>Delete</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

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
