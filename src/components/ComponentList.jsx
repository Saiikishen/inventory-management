
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
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
        quantity: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'components'), (snapshot) => {
            const componentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setComponents(componentsData);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewComponent(prev => ({ ...prev, [name]: value }));
    };

    const handleAddComponent = async () => {
        const { name, category, quantity } = newComponent;
        if (!name || !category) {
            setSnackbar({ open: true, message: 'Category and Name are required.', type: 'error' });
            return;
        }

        const initialQuantity = parseInt(quantity, 10) || 0;

        try {
            await addDoc(collection(db, 'components'), { ...newComponent, quantity: initialQuantity, createdAt: new Date() });
            setNewComponent({ name: '', category: '', value: '', footprint: '', toleranceRating: '', manufacturer: '', quantity: '' });
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
                <button onClick={handleAddComponent}>Add Component</button>
            </div>

            <table className="component-table">
                <thead>
                    <tr>
                        <th>Component ID</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {components.map((component) => (
                        <tr key={component.id}>
                            <td style={{ color: '#333 !important' }}>
                                <span style={{ color: '#333 !important' }}>{component.id}</span>
                            </td>
                            <td>{component.quantity || 0}</td>
                            <td>
                                <button className="delete-button" onClick={() => handleDeleteComponent(component.id)}>Delete</button>
                            </td>
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
