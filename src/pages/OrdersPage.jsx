import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OrdersPage.css';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [devicesByOrder, setDevicesByOrder] = useState({});
    const [newOrder, setNewOrder] = useState({ product: '', variant: '', quantity: '', remarks: '' });
    const [deviceNames, setDeviceNames] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
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

        const unsubscribeDeviceNames = onSnapshot(collection(db, 'device_names'), (snapshot) => {
            const deviceNamesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDeviceNames(deviceNamesData);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeDevices();
            unsubscribeDeviceNames();
        };
    }, []);

    const handleNewOrderChange = (e) => {
        const { name, value } = e.target;
        setNewOrder(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOrder = async (e) => {
        e.preventDefault();
        if (!newOrder.product || !newOrder.variant || !newOrder.quantity) {
            setSnackbar({ open: true, message: 'Please fill out all fields.', type: 'error' });
            return;
        }
        try {
            const orderId = `${newOrder.product}-${Math.random().toString(36).substr(2, 9)}`;
            await addDoc(collection(db, 'orders'), { ...newOrder, name: orderId, createdAt: new Date() });
            setSnackbar({ open: true, message: 'Order added successfully!', type: 'success' });
            setNewOrder({ product: '', variant: '', quantity: '', remarks: '' });
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

    const filteredOrders = orders.filter(order =>
        order.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="orders-page">
            <h2>Manage Orders</h2>

            <form onSubmit={handleAddOrder} className="add-order-form">
                <div className="form-field">
                    <label htmlFor="product">Product</label>
                    <select id="product" name="product" value={newOrder.product} onChange={handleNewOrderChange}>
                        <option value="">Select a Product</option>
                        {deviceNames.map(deviceName => (
                            <option key={deviceName.id} value={deviceName.name}>{deviceName.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="variant">Variant</label>
                    <input
                        id="variant"
                        type="text"
                        name="variant"
                        value={newOrder.variant}
                        onChange={handleNewOrderChange}
                        placeholder="Variant"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        value={newOrder.quantity}
                        onChange={handleNewOrderChange}
                        placeholder="Quantity"
                    />
                </div>
                <div className="form-field form-field-full-width">
                    <label htmlFor="remarks">Remarks</label>
                    <textarea
                        id="remarks"
                        name="remarks"
                        value={newOrder.remarks}
                        onChange={handleNewOrderChange}
                        placeholder="Remarks"
                    ></textarea>
                </div>
                <button type="submit">Add Order</button>
            </form>

            <h2>Existing Orders</h2>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by Order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredOrders.map(order => (
                <div key={order.id} className="order-card">
                    <div className="order-card-header">
                        <div>
                            <h3>Order ID: {order.name}</h3>
                            <p><strong>Product:</strong> {order.product}</p>
                            <p><strong>Variant:</strong> {order.variant}</p>
                            <p><strong>Quantity:</strong> {order.quantity}</p>
                            <p><strong>Remarks:</strong> {order.remarks}</p>
                            {order.createdAt && <p><strong>Order Date:</strong> {new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>}
                        </div>
                        <button onClick={() => openDeleteModal(order)} className="delete-button">Delete Order</button>
                    </div>

                    {(devicesByOrder[order.name] || []).map(device => (
                        <div key={device.id} className="device-details">
                            <h4>Part Number: {device.partNumber}</h4>
                            <p><strong>Est. Delivery Date:</strong> {device.estDeliveryDate}</p>
                            <p><strong>Status:</strong> {device.status}</p>
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
