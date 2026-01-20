import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './Circulation.css';

const Circulation = () => {
  const [componentId, setComponentId] = useState('');
  const [component, setComponent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [stockLocations, setStockLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribeLocations = onSnapshot(collection(db, 'stock_locations'), (snapshot) => {
        const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setStockLocations(locationsData);
    });

    return () => unsubscribeLocations();
  }, []);

  const handleSearch = async () => {
    if (!componentId) return;
    const docRef = doc(db, 'components', componentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const componentData = { id: docSnap.id, ...docSnap.data() };
      setComponent(componentData);
      setSelectedLocation(componentData.stockLocation || '');
      setError('');
      setSuccess('');
    } else {
      setComponent(null);
      setError('Component not found.');
      setSuccess('');
    }
  };

  const handleUpdateQuantity = async (operation) => {
    if (!component || isNaN(quantity) || quantity <= 0) {
        setError('Please enter a valid quantity.');
        setSuccess('');
        return;
    }
    if (!selectedLocation) {
        setError('Please select a stock location.');
        setSuccess('');
        return;
    }

    const newQuantity = operation === 'use' 
      ? component.quantity - quantity 
      : component.quantity + Number(quantity);

    if (newQuantity < 0) {
      setError('Cannot use more components than available.');
      setSuccess('');
      return;
    }

    const docRef = doc(db, 'components', component.id);
    await updateDoc(docRef, { quantity: newQuantity, stockLocation: selectedLocation });
    setComponent({ ...component, quantity: newQuantity, stockLocation: selectedLocation });
    setSuccess(`Successfully ${operation === 'use' ? 'used' : 'returned'} ${quantity} component(s).`);
    setError('');

    // Log the transaction
    const locationName = stockLocations.find(loc => loc.id === selectedLocation)?.name || 'N/A';
    const transactionDetails = `Component: ${component.name} (ID: ${component.id}), Quantity: ${quantity}, Location: ${locationName}`;
    await addDoc(collection(db, "transactions"), {
        type: `Circulation - ${operation === 'use' ? 'Use' : 'Return'}`,
        details: [transactionDetails],
        timestamp: serverTimestamp()
    });

    setQuantity(1);
  };

  return (
    <Box className="circulation-container">
      <Paper className="circulation-card" elevation={3}>
        <Typography variant="h4" className="circulation-title">
          Component <span className="mod-part">Circulation</span>
        </Typography>
        <TextField
          label="Component ID"
          variant="outlined"
          fullWidth
          value={componentId}
          onChange={(e) => setComponentId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="circulation-input"
        />
        {error && <Typography color="error" className="circulation-message">{error}</Typography>}
        {success && <Typography color="primary" className="circulation-message">{success}</Typography>}
        {component && (
          <>
            <Box className="component-details">
              <Typography variant="h6" sx={{fontWeight: '600'}}>{component.name}</Typography>
              <Typography>ID: {component.id}</Typography>
              <Typography>Available: {component.quantity}</Typography>
            </Box>
            <FormControl fullWidth className="circulation-input">
                <InputLabel>Stock Location</InputLabel>
                <Select
                    value={selectedLocation}
                    label="Stock Location"
                    onChange={(e) => setSelectedLocation(e.target.value)}
                >
                    {stockLocations.map(location => (
                        <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box className="circulation-actions">
              <TextField
                label="Quantity"
                type="number"
                variant="outlined"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="circulation-quantity"
                InputProps={{ inputProps: { min: 1 } }}
              />
              <Button onClick={() => handleUpdateQuantity('use')} variant="contained" color="primary">Use</Button>
              <Button onClick={() => handleUpdateQuantity('return')} variant="contained" color="secondary">Add</Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Circulation;
