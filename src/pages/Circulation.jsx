import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Circulation.css';

const Circulation = () => {
  const [componentId, setComponentId] = useState('');
  const [component, setComponent] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
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
    const componentRef = doc(db, 'components', componentId);
    const componentSnap = await getDoc(componentRef);

    if (componentSnap.exists()) {
      const componentData = { id: componentSnap.id, ...componentSnap.data() };
      setComponent(componentData);
      let inventoryData = [];
      if (componentData.locations && Array.isArray(componentData.locations)) {
        inventoryData = componentData.locations.map(loc => ({
          id: loc.id, // Assuming loc.id is the stockLocation id
          stockLocation: loc.id,
          quantity: loc.stock
        }));
      } else {
        const q = query(collection(db, 'inventory'), where('componentId', '==', componentId));
        const querySnapshot = await getDocs(q);
        inventoryData = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
      }
      setInventory(inventoryData);
      setError('');
      setSuccess('');
    } else {
      setComponent(null);
      setInventory([]);
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

    const inventoryItem = inventory.find(item => item.stockLocation === selectedLocation);
    if (!inventoryItem) {
        setError('Component not found at this location.');
        setSuccess('');
        return;
    }

    const newQuantity = operation === 'use' 
      ? inventoryItem.quantity - quantity 
      : inventoryItem.quantity + Number(quantity);

    if (newQuantity < 0) {
      setError('Cannot use more components than available at this location.');
      setSuccess('');
      return;
    }

    // If the data is in the inventory collection, update it there.
    // Otherwise, we need to update the embedded locations array in the component document.
    if (inventoryItem.id && !component.locations) { // Heuristic to check if it's from inventory collection
        const inventoryRef = doc(db, 'inventory', inventoryItem.id);
        await updateDoc(inventoryRef, { quantity: newQuantity });
    } else {
        const newLocations = component.locations.map(loc => 
            loc.id === selectedLocation ? { ...loc, stock: newQuantity } : loc
        );
        const componentRef = doc(db, 'components', component.id);
        await updateDoc(componentRef, { locations: newLocations });
    }

    const updatedInventory = inventory.map(item => item.stockLocation === selectedLocation ? {...item, quantity: newQuantity} : item)
    setInventory(updatedInventory);
    setSuccess(`Successfully ${operation === 'use' ? 'used' : 'returned'} ${quantity} component(s).`);
    setError('');

    // Log the transaction
    const locationName = stockLocations.find(loc => loc.id === selectedLocation)?.name || 'N/A';
    const transactionDetails = `Component: ${component.name} (ID: ${component.id}), Quantity: ${quantity}, Location: ${locationName}, Description: ${description}`;
    await addDoc(collection(db, "transactions"), {
        type: `Circulation - ${operation === 'use' ? 'Use' : 'Return'}`,
        details: [transactionDetails],
        timestamp: serverTimestamp()
    });

    setQuantity(1);
    setDescription('');
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
              {inventory.map(item => (
                  <Typography key={item.id}>
                      {stockLocations.find(loc => loc.id === item.stockLocation)?.name}: {item.quantity}
                  </Typography>
              ))}
            </Box>
            <FormControl fullWidth className="circulation-input">
                <InputLabel>Stock Location</InputLabel>
                <Select
                    value={selectedLocation}
                    label="Stock Location"
                    onChange={(e) => setSelectedLocation(e.target.value)}
                >
                    {inventory.map(item => (
                        <MenuItem key={item.id} value={item.stockLocation}>
                            {stockLocations.find(loc => loc.id === item.stockLocation)?.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                label="Description"
                variant="outlined"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="circulation-input"
                sx={{ mt: 2 }}
              />
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
