import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OrdersListPage.css';

const OrdersListPage = () => {
    const [orders, setOrders] = useState([]);
    const [devicesByOrder, setDevicesByOrder] = useState({});
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const priorityMap = { 'High': 4, 'Medium': 3, 'Low': 2, 'Deployed': 1 };
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => {
                const priorityA = priorityMap[a.priority] || 0;
                const priorityB = priorityMap[b.priority] || 0;
                if (priorityB !== priorityA) {
                    return priorityB - priorityA;
                }
                return b.createdAt?.seconds - a.createdAt?.seconds;
            });
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

    const handlePriorityChange = async (orderId, priority) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { priority });
    };

    const openEditModal = (order) => {
        setSelectedOrder(order);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedOrder(null);
        setEditModalOpen(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedOrder(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedOrder) {
            try {
                const { id, ...orderData } = selectedOrder;
                const orderRef = doc(db, 'orders', id);
                await updateDoc(orderRef, orderData);
                setSnackbar({ open: true, message: 'Order updated successfully!', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error updating order: ${error.message}`, type: 'error' });
            }
            closeEditModal();
        }
    };

    const filteredOrders = orders.filter(order =>
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.referenceName && order.referenceName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="orders-list-page">
            <h2>All Orders</h2>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by Order ID or Reference Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredOrders.map(order => (
                <div key={order.id} className="order-card">
                    <div className="order-card-header">
                        <div>
                            <h3>Order ID: {order.name}</h3>
                            <p><strong>Reference Name:</strong> {order.referenceName}</p>
                            <p><strong>Product:</strong> {order.product}</p>
                            <p><strong>Variant:</strong> {order.variant}</p>
                            <p><strong>Quantity:</strong> {order.quantity}</p>
                            <p><strong>Remarks:</strong> {order.remarks}</p>
                            {order.createdAt && <p><strong>Order Date:</strong> {new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>}
                        </div>
                        <div className="order-card-actions">
                            {order.priority && <span className={`priority-stamp ${order.priority.toLowerCase()}`}>{order.priority}</span>}
                            <div className="priority-selector">
                                <label>Priority: </label>
                                <select value={order.priority || ''} onChange={(e) => handlePriorityChange(order.id, e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                    <option value="Deployed">Deployed</option>
                                </select>
                            </div>
                            <button onClick={() => openEditModal(order)} className="action-button edit-button">Edit</button>
                        </div>
                    </div>

                    <h4>Devices in this Order:</h4>
                    {(devicesByOrder[order.name] || []).length > 0 ? (
                        (devicesByOrder[order.name] || []).map(device => (
                            <div key={device.id} className="device-details">
                                <p><strong>Part Number:</strong> {device.partNumber}</p>
                                <p><strong>Est. Delivery Date:</strong> {device.estDeliveryDate}</p>
                                <p><strong>Status:</strong> {device.status}</p>
                            </div>
                        ))
                    ) : (
                        <p>No devices found for this order.</p>
                    )}
                </div>
            ))}

            {isEditModalOpen && selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <h2>Edit Order</h2>
                        <form onSubmit={handleUpdate} className="edit-form">
                            <div className="form-field">
                                <label>Reference Name</label>
                                <input type="text" name="referenceName" value={selectedOrder.referenceName} onChange={handleEditChange} placeholder="Reference Name" />
                            </div>
                            <div className="form-field">
                                <label>Product</label>
                                <input type="text" name="product" value={selectedOrder.product} onChange={handleEditChange} placeholder="Product" />
                            </div>
                            <div className="form-field">
                                <label>Variant</label>
                                <input type="text" name="variant" value={selectedOrder.variant} onChange={handleEditChange} placeholder="Variant" />
                            </div>
                            <div className="form-field">
                                <label>Quantity</label>
                                <input type="number" name="quantity" value={selectedOrder.quantity} onChange={handleEditChange} placeholder="Quantity" />
                            </div>
                            <div className="form-field full-width">
                                <label>Remarks</label>
                                <textarea name="remarks" value={selectedOrder.remarks} onChange={handleEditChange} placeholder="Remarks"></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">Save Changes</button>
                                <button type="button" onClick={closeEditModal} className="cancel-button">Cancel</button>
                            </div>
                        </form>
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

export default OrdersListPage;
