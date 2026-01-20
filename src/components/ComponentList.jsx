import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import './ComponentList.css';

const ComponentList = () => {
    const [inventory, setInventory] = useState([]);
    const [components, setComponents] = useState({});
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
    const [editingInventoryId, setEditingInventoryId] = useState(null);
    const [editedInventoryData, setEditedInventoryData] = useState({ quantity: '', pricing: '', manufacturer: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setInventory(inventoryData);
        });

        const unsubscribeComponents = onSnapshot(collection(db, 'components'), (snapshot) => {
            const componentsData = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = doc.data();
                return acc;
            }, {});
            setComponents(componentsData);
        });

        const unsubscribeLocations = onSnapshot(collection(db, 'stock_locations'), (snapshot) => {
            const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setStockLocations(locationsData);
        });

        return () => {
            unsubscribeInventory();
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
        const isLocationInUse = inventory.some(item => item.stockLocation === id);
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
        const { name, category, value, footprint, toleranceRating, manufacturer, quantity, stockLocation, pricing } = newComponent;
        if (!name || !category || !stockLocation) {
            setSnackbar({ open: true, message: 'Category, Name, and Stock Location are required.', type: 'error' });
            return;
        }

        const componentId = [category, name, value, footprint, toleranceRating].join('-').toUpperCase();
        const initialQuantity = parseInt(quantity, 10) || 0;

        try {
            const batch = writeBatch(db);
            const componentRef = doc(db, 'components', componentId);
            batch.set(componentRef, { name, category, value, footprint, toleranceRating, manufacturer, pricing, createdAt: new Date() });

            const inventoryRef = doc(collection(db, 'inventory'));
            batch.set(inventoryRef, { componentId, stockLocation, quantity: initialQuantity });

            await batch.commit();

            setNewComponent({ name: '', category: '', value: '', footprint: '', toleranceRating: '', manufacturer: '', quantity: '', stockLocation: '', pricing: '' });
            setSnackbar({ open: true, message: 'Component and inventory added successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding component: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteInventory = async (id) => {
        try {
            await deleteDoc(doc(db, 'inventory', id));
            setSnackbar({ open: true, message: 'Inventory entry deleted successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error deleting inventory: ${error.message}`, type: 'error' });
        }
    };

    const handleEditClick = (item) => {
        setEditingInventoryId(item.id);
        setEditedInventoryData({ 
            quantity: item.quantity || 0,
            pricing: components[item.componentId]?.pricing || '', 
            manufacturer: components[item.componentId]?.manufacturer || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingInventoryId(null);
        setEditedInventoryData({ quantity: '', pricing: '', manufacturer: '' });
    };

    const handleUpdateInventory = async () => {
        if (!editingInventoryId) return;
        const item = inventory.find(i => i.id === editingInventoryId);

        try {
            const batch = writeBatch(db);
            const inventoryRef = doc(db, 'inventory', editingInventoryId);
            batch.update(inventoryRef, { quantity: parseInt(editedInventoryData.quantity, 10) || 0 });

            const componentRef = doc(db, 'components', item.componentId);
            batch.update(componentRef, { 
                pricing: editedInventoryData.pricing, 
                manufacturer: editedInventoryData.manufacturer 
            });

            await batch.commit();

            setSnackbar({ open: true, message: 'Inventory updated successfully!', type: 'success' });
            handleCancelEdit();
        } catch (error) {
            setSnackbar({ open: true, message: `Error updating inventory: ${error.message}`, type: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ open: false, message: '', type: snackbar.type });
    };

    const renderManufacturerLinks = (manufacturer) => {
        if (!manufacturer) return null;
        return manufacturer.split(',').map((link, index) => {
            const trimmedLink = link.trim();
            let domain = '';
            try {
                domain = new URL(trimmedLink).hostname;
            } catch (e) {
                domain = trimmedLink;
            }
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
                <input type="text" name="manufacturer" value={newComponent.manufacturer} onChange={handleInputChange} placeholder="Manufacturer" />
                <input type="number" name="quantity" value={newComponent.quantity} onChange={handleInputChange} placeholder="Initial Quantity" />
                <input type="number" name="pricing" value={newComponent.pricing} onChange={handleInputChange} placeholder="Pricing" />
                <select name="stockLocation" value={newComponent.stockLocation} onChange={handleInputChange}>
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
                        <th>Manufacturer</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((item) => (
                        <tr key={item.id}>
                            <td>{item.componentId}</td>
                            <td>{stockLocations.find(loc => loc.id === item.stockLocation)?.name}</td>
                            {editingInventoryId === item.id ? (
                                <>
                                    <td>
                                        <input
                                            type="number"
                                            value={editedInventoryData.quantity}
                                            onChange={(e) => setEditedInventoryData({ ...editedInventoryData, quantity: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={editedInventoryData.pricing}
                                            onChange={(e) => setEditedInventoryData({ ...editedInventoryData, pricing: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={editedInventoryData.manufacturer}
                                            onChange={(e) => setEditedInventoryData({ ...editedInventoryData, manufacturer: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <button className="action-button edit-button" onClick={handleUpdateInventory}>Save</button>
                                        <button className="action-button cancel-button" onClick={handleCancelEdit}>Cancel</button>
                                    </td>
                                </> 
                            ) : (
                                <>
                                    <td>{item.quantity || 0}</td>
                                    <td>{components[item.componentId]?.pricing}</td>
                                    <td>{renderManufacturerLinks(components[item.componentId]?.manufacturer)}</td>
                                    <td>
                                        <button className="action-button edit-button" onClick={() => handleEditClick(item)}>Edit</button>
                                        <button className="action-button delete-button" onClick={() => handleDeleteInventory(item.id)}>Delete</button>
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
