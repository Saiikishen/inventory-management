import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OrdersListPage.css';

const OrdersListPage = () => {
    const [orders, setOrders] = useState([]);
    const [devicesByOrder, setDevicesByOrder] = useState({});

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
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

    return (
        <div className="orders-list-page">
            <h2>All Orders</h2>
            {orders.map(order => (
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
                        <div className="order-card-actions">
                            {order.priority && <span className={`priority-stamp ${order.priority.toLowerCase()}`}>{order.priority}</span>}
                            <div className="priority-selector">
                                <label>Priority: </label>
                                <select value={order.priority || 'Medium'} onChange={(e) => handlePriorityChange(order.id, e.target.value)}>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
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
        </div>
    );
};

export default OrdersListPage;
