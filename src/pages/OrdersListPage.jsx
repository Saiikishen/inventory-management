import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './OrdersListPage.css';

const OrdersListPage = () => {
    const [orders, setOrders] = useState([]);
    const [devicesByOrder, setDevicesByOrder] = useState({});

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
