import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './DevicesPage.css';

const DevicesPage = () => {
    const [device, setDevice] = useState({
        manufactureDate: '',
        soldDate: '',
        clientName: '',
        location: '',
        partNumber: '',
        deviceId: '',
        wifiConfig: { ssid: '', password: '' },
        count: '',
        type: { display: '', pcbVersion: '', firmwareVersion: '' },
        communicationProtocol: '',
        machine: '',
        power: '',
        remarks: '',
        orderId: ''
    });
    const [orders, setOrders] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setOrders(ordersData);
        });

        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setDevice(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setDevice(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for unique part number
        const q = query(collection(db, 'devices'), where('partNumber', '==', device.partNumber));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            setSnackbar({ open: true, message: 'Part number already exists.', type: 'error' });
            return;
        }

        try {
            await addDoc(collection(db, 'devices'), device);
            setSnackbar({ open: true, message: 'Device added successfully!', type: 'success' });
            // Reset form
            setDevice({
                manufactureDate: '',
                soldDate: '',
                clientName: '',
                location: '',
                partNumber: '',
                deviceId: '',
                wifiConfig: { ssid: '', password: '' },
                count: '',
                type: { display: '', pcbVersion: '', firmwareVersion: '' },
                communicationProtocol: '',
                machine: '',
                power: '',
                remarks: '',
                orderId: ''
            });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding device: ${error.message}`, type: 'error' });
        }
    };

    return (
        <div className="devices-page">
            <h2>Add New Device</h2>
            <form onSubmit={handleSubmit} className="device-form">
                 <div className="form-field">
                    <label htmlFor="partNumber">Part Number</label>
                    <input id="partNumber" type="text" name="partNumber" value={device.partNumber} onChange={handleChange} required />
                </div>
                <div className="form-field">
                    <label htmlFor="orderId">Order</label>
                    <select id="orderId" name="orderId" value={device.orderId} onChange={handleChange}>
                        <option value="">Select an Order</option>
                        {orders.map(order => (
                            <option key={order.id} value={order.name}>{order.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="manufactureDate">Manufacture Date</label>
                    <input id="manufactureDate" type="date" name="manufactureDate" value={device.manufactureDate} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="soldDate">Sold Date</label>
                    <input id="soldDate" type="date" name="soldDate" value={device.soldDate} onChange={handleChange} />
                </div>
                <input type="text" name="clientName" value={device.clientName} onChange={handleChange} placeholder="Client Name" />
                <input type="text" name="location" value={device.location} onChange={handleChange} placeholder="Location" />
                <input type="text" name="deviceId" value={device.deviceId} onChange={handleChange} placeholder="Device ID" />
                <input type="text" name="wifiConfig.ssid" value={device.wifiConfig.ssid} onChange={handleChange} placeholder="WiFi SSID" />
                <input type="password" name="wifiConfig.password" value={device.wifiConfig.password} onChange={handleChange} placeholder="WiFi Password" />
                <input type="number" name="count" value={device.count} onChange={handleChange} placeholder="Count" />
                <input type="text" name="type.display" value={device.type.display} onChange={handleChange} placeholder="Display Type" />
                <input type="text" name="type.pcbVersion" value={device.type.pcbVersion} onChange={handleChange} placeholder="PCB Version" />
                <input type="text" name="type.firmwareVersion" value={device.type.firmwareVersion} onChange={handleChange} placeholder="Firmware Version" />
                <input type="text" name="communicationProtocol" value={device.communicationProtocol} onChange={handleChange} placeholder="Communication Protocol" />
                <input type="text" name="machine" value={device.machine} onChange={handleChange} placeholder="Machine" />
                <input type="text" name="power" value={device.power} onChange={handleChange} placeholder="Power" />
                <textarea name="remarks" value={device.remarks} onChange={handleChange} placeholder="Remarks"></textarea>
                <button type="submit">Add Device</button>
            </form>
            {snackbar.open && (
                <div className={`snackbar ${snackbar.type}`}>
                    {snackbar.message}
                    <button onClick={() => setSnackbar({ ...snackbar, open: false })}>X</button>
                </div>
            )}
        </div>
    );
};

export default DevicesPage;
