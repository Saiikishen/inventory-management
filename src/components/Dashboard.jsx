import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css';

const Dashboard = () => {
    const [totalOrders, setTotalOrders] = useState(0);
    const [deployedItems, setDeployedItems] = useState(0);

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const total = snapshot.docs.reduce((sum, doc) => sum + (parseInt(doc.data().quantity, 10) || 0), 0);
            setTotalOrders(total);
        });

        const unsubscribeDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
            const deployed = snapshot.docs.filter(doc => doc.data().status === 'deployed').length;
            setDeployedItems(deployed);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeDevices();
        };
    }, []);

    const pendingOrders = totalOrders - deployedItems;

    return (
        <div className="dashboard">
            <div className="dashboard-item">
                <h3>Total Orders</h3>
                <p>{totalOrders}</p>
            </div>
            <div className="dashboard-item">
                <h3>Deployed Items</h3>
                <p>{deployedItems}</p>
            </div>
            <div className="dashboard-item">
                <h3>Pending Orders</h3>
                <p>{pendingOrders}</p>
            </div>
        </div>
    );
};

export default Dashboard;
