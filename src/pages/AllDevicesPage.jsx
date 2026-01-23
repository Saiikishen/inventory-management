import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AllDevicesPage.css';

const AllDevicesPage = () => {
    const [devices, setDevices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    useEffect(() => {
        const unsubscribeDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
            const devicesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDevices(devicesData);
            setFilteredDevices(devicesData);
        });

        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setOrders(ordersData);
        });

        return () => {
            unsubscribeDevices();
            unsubscribeOrders();
        };
    }, []);

    useEffect(() => {
        const results = devices.filter(device =>
            device.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDevices(results);
    }, [searchTerm, devices]);

    const openDeleteModal = (device) => {
        setSelectedDevice(device);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedDevice(null);
        setDeleteModalOpen(false);
    };

    const handleDelete = async () => {
        if (selectedDevice) {
            try {
                await deleteDoc(doc(db, 'devices', selectedDevice.id));
                setSnackbar({ open: true, message: 'Device deleted successfully!', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error deleting device: ${error.message}`, type: 'error' });
            }
            closeDeleteModal();
        }
    };

    const openEditModal = (device) => {
        setSelectedDevice({ 
            ...device,
            wifiConfig: device.wifiConfig || { ssid: '', password: '' },
            type: device.type || { display: '', pcbVersion: '', firmwareVersion: '' }
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedDevice(null);
        setEditModalOpen(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSelectedDevice(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setSelectedDevice(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedDevice) {
            try {
                const { id, ...deviceData } = selectedDevice;
                const deviceRef = doc(db, 'devices', id);
                await updateDoc(deviceRef, deviceData);
                setSnackbar({ open: true, message: 'Device updated successfully!', type: 'success' });
            } catch (error) {
                setSnackbar({ open: true, message: `Error updating device: ${error.message}`, type: 'error' });
            }
            closeEditModal();
        }
    };

    return (
        <div className="all-devices-page">
            <h2>All Devices</h2>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by Part Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="device-list">
                {filteredDevices.map(device => (
                    <div key={device.id} className="device-card">
                        <h3>Part Number: {device.partNumber}</h3>
                        <p><strong>Order ID:</strong> {device.orderId || 'N/A'}</p>
                        <p><strong>Client Name:</strong> {device.clientName || 'N/A'}</p>
                        <p><strong>Location:</strong> {device.location || 'N/A'}</p>
                        <p><strong>Manufacture Date:</strong> {device.manufactureDate || 'N/A'}</p>
                        <p><strong>Sold Date:</strong> {device.soldDate || 'N/A'}</p>
                        <div className="device-card-actions">
                            <button onClick={() => openEditModal(device)} className="action-button edit-button">Edit</button>
                            <button onClick={() => openDeleteModal(device)} className="action-button delete-button">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {isDeleteModalOpen && (
                 <div className="modal-overlay">
                    <div className="modal">
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this device? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={handleDelete} className="delete-confirm-button">Delete</button>
                            <button onClick={closeDeleteModal} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && selectedDevice && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <h2>Edit Device</h2>
                        <form onSubmit={handleUpdate} className="edit-form device-form">
                            <div className="form-field">
                                <label>Part Number</label>
                                <input type="text" value={selectedDevice.partNumber} readOnly disabled />
                            </div>
                            <div className="form-field">
                                <label>Device ID</label>
                                <input type="text" name="deviceId" value={selectedDevice.deviceId} onChange={handleEditChange} placeholder="Device ID" />
                            </div>
                            <div className="form-field">
                                <label>Order</label>
                                <select name="orderId" value={selectedDevice.orderId} onChange={handleEditChange}>
                                    <option value="">Select an Order</option>
                                    {orders.map(order => (
                                        <option key={order.id} value={order.name}>{order.name}</option>
                                    ))}
                                </select>
                            </div>
                             <div className="form-field">
                                <label>Client Name</label>
                                <input type="text" name="clientName" value={selectedDevice.clientName} onChange={handleEditChange} placeholder="Client Name" />
                            </div>
                            <div className="form-field">
                                <label>Location</label>
                                <input type="text" name="location" value={selectedDevice.location} onChange={handleEditChange} placeholder="Location" />
                            </div>
                             <div className="form-field">
                                <label>Manufacture Date</label>
                                <input type="date" name="manufactureDate" value={selectedDevice.manufactureDate} onChange={handleEditChange} />
                            </div>
                            <div className="form-field">
                                <label>Sold Date</label>
                                <input type="date" name="soldDate" value={selectedDevice.soldDate} onChange={handleEditChange} />
                            </div>
                             <div className="form-field">
                                <label>Count</label>
                                <input type="number" name="count" value={selectedDevice.count} onChange={handleEditChange} placeholder="Count" />
                            </div>
                             <div className="form-field">
                                <label>Display Type</label>
                                <input type="text" name="type.display" value={selectedDevice.type.display} onChange={handleEditChange} placeholder="Display Type" />
                            </div>
                            <div className="form-field">
                                <label>PCB Version</label>
                                <input type="text" name="type.pcbVersion" value={selectedDevice.type.pcbVersion} onChange={handleEditChange} placeholder="PCB Version" />
                            </div>
                            <div className="form-field">
                                <label>Firmware Version</label>
                                <input type="text" name="type.firmwareVersion" value={selectedDevice.type.firmwareVersion} onChange={handleEditChange} placeholder="Firmware Version" />
                            </div>
                             <div className="form-field">
                                <label>WiFi SSID</label>
                                <input type="text" name="wifiConfig.ssid" value={selectedDevice.wifiConfig.ssid} onChange={handleEditChange} placeholder="WiFi SSID" />
                            </div>
                            <div className="form-field">
                                <label>WiFi Password</label>
                                <input type="password" name="wifiConfig.password" value={selectedDevice.wifiConfig.password} onChange={handleEditChange} placeholder="WiFi Password" />
                            </div>
                             <div className="form-field">
                                <label>Communication Protocol</label>
                                <input type="text" name="communicationProtocol" value={selectedDevice.communicationProtocol} onChange={handleEditChange} placeholder="Communication Protocol" />
                            </div>
                            <div className="form-field">
                                <label>Machine</label>
                                <input type="text" name="machine" value={selectedDevice.machine} onChange={handleEditChange} placeholder="Machine" />
                            </div>
                            <div className="form-field">
                                <label>Power</label>
                                <input type="text" name="power" value={selectedDevice.power} onChange={handleEditChange} placeholder="Power" />
                            </div>
                             <div className="form-field full-width">
                                <label>Remarks</label>
                                <textarea name="remarks" value={selectedDevice.remarks} onChange={handleEditChange} placeholder="Remarks"></textarea>
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

export default AllDevicesPage;
