import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
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
        orderId: '',
        deviceName: '',
        status: '',
        estDeliveryDate: ''
    });
    const [orders, setOrders] = useState([]);
    const [deviceNames, setDeviceNames] = useState([]);
    const [showNewDeviceNameInput, setShowNewDeviceNameInput] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [showRemoveDeviceNameUI, setShowRemoveDeviceNameUI] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setOrders(ordersData);
        });

        const unsubscribeDeviceNames = onSnapshot(collection(db, 'device_names'), (snapshot) => {
            const deviceNamesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDeviceNames(deviceNamesData);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeDeviceNames();
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'deviceName' && value === 'add-new') {
            setShowNewDeviceNameInput(true);
            setShowRemoveDeviceNameUI(false);
        } else if (name === 'deviceName' && value === 'remove-device') {
            setShowRemoveDeviceNameUI(true);
            setShowNewDeviceNameInput(false);
        } else if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setDevice(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setDevice(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveNewDeviceName = async () => {
        if (!newDeviceName) {
            setSnackbar({ open: true, message: 'Device name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'device_names'), { name: newDeviceName });
            setDevice(prev => ({ ...prev, deviceName: docRef.id }));
            setShowNewDeviceNameInput(false);
            setNewDeviceName('');
            setSnackbar({ open: true, message: 'Device name added successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding device name: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteDeviceName = async (id) => {
        try {
            await deleteDoc(doc(db, 'device_names', id));
            setSnackbar({ open: true, message: 'Device name deleted successfully!', type: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: `Error deleting device name: ${error.message}`, type: 'error' });
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
                orderId: '',
                deviceName: '',
                status: '',
                estDeliveryDate: ''
            });
        } catch (error) {
            setSnackbar({ open: true, message: `Error adding device: ${error.message}`, type: 'error' });
        }
    };

    return (
        <div className="devices-page">
            <h2>Add New Device</h2>
            <form onSubmit={handleSubmit} className="device-form">
                <div className="form-field form-field-full-width">
                    <label htmlFor="deviceName">Device Name</label>
                    <select id="deviceName" name="deviceName" value={device.deviceName} onChange={handleChange}>
                        <option value="">Select a Device</option>
                        {deviceNames.map(name => (
                            <option key={name.id} value={name.name}>{name.name}</option>
                        ))}
                        <option value="add-new">Add new device...</option>
                        <option value="remove-device">Remove a device...</option>
                    </select>
                </div>
                {showNewDeviceNameInput && (
                    <div className="new-device-name-input-container">
                        <input type="text" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} placeholder="New Device Name" />
                        <button onClick={handleSaveNewDeviceName}>Save</button>
                    </div>
                )}
                {showRemoveDeviceNameUI && (
                    <div className="remove-device-name-ui">
                        <h3>Remove a Device Name</h3>
                        <ul>
                            {deviceNames.map(name => (
                                <li key={name.id}>{name.name}<button onClick={() => handleDeleteDeviceName(name.id)}>Delete</button></li>
                            ))}
                        </ul>
                    </div>
                )}
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
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={device.status} onChange={handleChange}>
                        <option value="">Select Status</option>
                        <option value="order received">Order Received</option>
                        <option value="production begun">Production Begun</option>
                        <option value="shipped">Shipped</option>
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="estDeliveryDate">Est. Delivery Date</label>
                    <input id="estDeliveryDate" type="date" name="estDeliveryDate" value={device.estDeliveryDate} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="manufactureDate">Manufacture Date</label>
                    <input id="manufactureDate" type="date" name="manufactureDate" value={device.manufactureDate} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="soldDate">Sold Date</label>
                    <input id="soldDate" type="date" name="soldDate" value={device.soldDate} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="clientName">Client Name</label>
                    <input id="clientName" type="text" name="clientName" value={device.clientName} onChange={handleChange} placeholder="Client Name" />
                </div>
                <div className="form-field">
                    <label htmlFor="location">Location</label>
                    <input id="location" type="text" name="location" value={device.location} onChange={handleChange} placeholder="Location" />
                </div>
                <div className="form-field">
                    <label htmlFor="deviceId">Device ID</label>
                    <input id="deviceId" type="text" name="deviceId" value={device.deviceId} onChange={handleChange} placeholder="Device ID" />
                </div>
                <div className="form-field">
                    <label htmlFor="wifiConfig.ssid">WiFi SSID</label>
                    <input id="wifiConfig.ssid" type="text" name="wifiConfig.ssid" value={device.wifiConfig.ssid} onChange={handleChange} placeholder="WiFi SSID" />
                </div>
                <div className="form-field">
                    <label htmlFor="wifiConfig.password">WiFi Password</label>
                    <input id="wifiConfig.password" type="password" name="wifiConfig.password" value={device.wifiConfig.password} onChange={handleChange} placeholder="WiFi Password" />
                </div>
                <div className="form-field">
                    <label htmlFor="count">Count</label>
                    <input id="count" type="number" name="count" value={device.count} onChange={handleChange} placeholder="Count" />
                </div>
                <div className="form-field">
                    <label htmlFor="type.display">Display Type</label>
                    <input id="type.display" type="text" name="type.display" value={device.type.display} onChange={handleChange} placeholder="Display Type" />
                </div>
                <div className="form-field">
                    <label htmlFor="type.pcbVersion">PCB Version</label>
                    <input id="type.pcbVersion" type="text" name="type.pcbVersion" value={device.type.pcbVersion} onChange={handleChange} placeholder="PCB Version" />
                </div>
                <div className="form-field">
                    <label htmlFor="type.firmwareVersion">Firmware Version</label>
                    <input id="type.firmwareVersion" type="text" name="type.firmwareVersion" value={device.type.firmwareVersion} onChange={handleChange} placeholder="Firmware Version" />
                </div>
                <div className="form-field">
                    <label htmlFor="communicationProtocol">Communication Protocol</label>
                    <input id="communicationProtocol" type="text" name="communicationProtocol" value={device.communicationProtocol} onChange={handleChange} placeholder="Communication Protocol" />
                </div>
                <div className="form-field">
                    <label htmlFor="machine">Machine</label>
                    <input id="machine" type="text" name="machine" value={device.machine} onChange={handleChange} placeholder="Machine" />
                </div>
                <div className="form-field">
                    <label htmlFor="power">Power</label>
                    <input id="power" type="text" name="power" value={device.power} onChange={handleChange} placeholder="Power" />
                </div>
                <div className="form-field form-field-full-width">
                    <label htmlFor="remarks">Remarks</label>
                    <textarea id="remarks" name="remarks" value={device.remarks} onChange={handleChange} placeholder="Remarks"></textarea>
                </div>
                <div className="form-field-full-width">
                    <button type="submit">Add Device</button>
                </div>
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
