import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OrdersPage.css';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [devicesByOrder, setDevicesByOrder] = useState({});
    const [newOrderName, setNewOrderName] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setOrders(ordersData);
        });

        const unsubscribeDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
            const devicesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            const groupedByOrder = devicesData.reduce((acc, device) => {
                const orderId = device.orderId || 'unassigned';
                if (!acc[orderId]) {
                    acc[orderId] = [];
                }
                acc[orderId].push(device);
                return acc;
            }, {});
            setDevicesByOrder(groupedByOrder);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeDevices();
        };
    }, []);

    const handleAddOrder = async (e) => {
        e.preventDefault();
        if (!newOrderName.trim()) {
            setSnackbar({ open: true, message: 'Order name cannot be empty.', type: 'error' });
            return;
        }
        try {
            await addDoc(collection(db, 'orders'), { name: newOrderName, createdAt: new Date() });
            setSnackbar({ open: true, message: 'Order added successfully!', type: 'success' });
            setNewOrderName('');
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding order: ${error.message}`, type: 'error' });
        }
    };

    const openDeleteModal = (order) => {
        setOrderToDelete(order);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setOrderToDelete(null);
        setDeleteModalOpen(false);
    };

    const confirmDeleteOrder = async () => {
        if (orderToDelete) {
            try {
                await deleteDoc(doc(db, 'orders', orderToDelete.id));
                setSnackbar({ open: true, message: 'Order deleted successfully!', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error deleting order: ${error.message}`, type: 'error' });
            }
            closeDeleteModal();
        }
    };

    return (
        <div className="orders-page">
            <h2>Manage Orders</h2>

            <form onSubmit={handleAddOrder} className="add-order-form">
                <input
                    type="text"
                    value={newOrderName}
                    onChange={(e) => setNewOrderName(e.target.value)}
                    placeholder="Enter new order name"
                />
                <button type="submit">Add Order</button>
            </form>

            <h2>Existing Orders</h2>
            {orders.map(order => (
                <div key={order.id} className="order-card">
                    <div className="order-card-header">
                        <div>
                            <h3>Order ID: {order.name}</h3>
                            {order.createdAt && <p><strong>Order Date:</strong> {new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>}
                        </div>
                        <button onClick={() => openDeleteModal(order)} className="delete-button">Delete Order</button>
                    </div>

                    {(devicesByOrder[order.name] || []).map(device => (
                        <div key={device.id} className="device-details">
                            <h4>Part Number: {device.partNumber}</h4>
                            {/* Device details... */}
                        </div>
                    ))}
                     {(!devicesByOrder[order.name] || devicesByOrder[order.name].length === 0) && (
                        <p>No devices found for this order.</p>
                    )}
                </div>
            ))}

            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete the order "{orderToDelete?.name}"? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={confirmDeleteOrder} className="delete-confirm-button">Delete</button>
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

export default OrdersPage;
