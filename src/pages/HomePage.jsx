import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, InputAdornment, Chip, List, ListItem, ListItemText, Collapse } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import './HomePage.css';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchInventory, setSearchInventory] = useState([]);
  const [searchError, setSearchError] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [componentsInCategory, setComponentsInCategory] = useState([]);
  const [stockLocations, setStockLocations] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch categories
      const componentsSnapshot = await getDocs(collection(db, 'components'));
      const categoriesSet = new Set(componentsSnapshot.docs.map(doc => doc.data().category));
      setCategories(Array.from(categoriesSet));
      
      // Fetch stock locations
      const locationsQuery = await getDocs(collection(db, 'stock_locations'));
      const locationsData = locationsQuery.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setStockLocations(locationsData);
    };

    fetchInitialData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearchResult(null);
    setSearchInventory([]);
    setSelectedCategory(null);
    setComponentsInCategory([]);

    const componentRef = doc(db, 'components', searchQuery);
    const componentSnap = await getDoc(componentRef);

    if (componentSnap.exists()) {
      const componentData = { id: componentSnap.id, ...componentSnap.data() };
      setSearchResult(componentData);
      if (componentData.locations && Array.isArray(componentData.locations)) {
        const inventoryData = componentData.locations.map(loc => ({
          id: loc.id, // Assuming loc.id is the stockLocation id
          stockLocation: loc.id,
          quantity: loc.stock
        }));
        setSearchInventory(inventoryData);
      } else {
        const q = query(collection(db, 'inventory'), where('componentId', '==', searchQuery));
        const querySnapshot = await getDocs(q);
        const inventoryData = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
        setSearchInventory(inventoryData);
      }
      setSearchError('');
    } else {
        setSearchError('Component not found.');
    }
  };

  const handleCategoryClick = async (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setComponentsInCategory([]);
      return;
    }

    setSearchResult(null);
    setSearchError('');
    setSelectedCategory(category);
    
    const q = query(collection(db, 'components'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    const componentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const componentsWithInventory = await Promise.all(
        componentsData.map(async (comp) => {
            let inventoryData = [];
            if (comp.locations && Array.isArray(comp.locations)) {
              inventoryData = comp.locations.map(loc => ({
                stockLocation: loc.id,
                quantity: loc.stock
              }));
            } else {
              const inventoryQuery = query(collection(db, 'inventory'), where('componentId', '==', comp.id));
              const inventorySnapshot = await getDocs(inventoryQuery);
              inventoryData = inventorySnapshot.docs.map(doc => doc.data());
            }
            const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
            return { ...comp, inventory: inventoryData, totalQuantity };
        })
    );
    setComponentsInCategory(componentsWithInventory);
  };

  const getLocationName = (locationId) => {
    const location = stockLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <Box className="home-page-container">
      <Box className="home-left-panel">
        <div className="home-branding">
          <h1 className="home-page-title">
            <span className="charge-part">charge</span><span className="mod-part">MOD</span>
          </h1>
        </div>
      </Box>
      <Box className="home-right-panel">
        <section className="home-search-section">
          <Typography variant="h4" component="h2" gutterBottom>
            Search Components by ID
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter Component ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {searchError && <Typography color="error" sx={{mt: 2}}>{searchError}</Typography>}
          {searchResult && (
             <Box mt={2} p={2} sx={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                <Typography variant="h6">{searchResult.name}</Typography>
                <Typography>ID: {searchResult.id}</Typography>
                {searchResult.manufacturerPartNo && <Typography>Manufacturer Part No: {searchResult.manufacturerPartNo}</Typography>}
                <Box mt={1}>
                    <Typography variant="subtitle1" sx={{fontWeight: '600'}}>Stock by Location:</Typography>
                    {searchInventory.length > 0 ? (
                        searchInventory.map(item => (
                            <Typography key={item.id}>
                                {getLocationName(item.stockLocation)}: {item.quantity}
                            </Typography>
                        ))
                    ) : (
                        <Typography>No stock information available.</Typography>
                    )}
                </Box>
            </Box>
          )}
        </section>
        <section className="home-category-section">
          <Typography variant="h4" component="h2" gutterBottom>
            Browse by Category
          </Typography>
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
            {categories.map(category => (
                <Chip 
                    key={category} 
                    label={category} 
                    onClick={() => handleCategoryClick(category)} 
                    color={selectedCategory === category ? 'primary' : 'default'}
                />
            ))}
          </Box>
          {selectedCategory && (
             <List>
                {componentsInCategory.map(comp => (
                    <React.Fragment key={comp.id}>
                        <ListItem className="list-item-container">
                            <ListItemText 
                                primary={`${comp.name} (Total: ${comp.totalQuantity})`} 
                                secondary={(
                                    <>
                                        <Typography component="span" variant="body2" color="text.primary">
                                            ID: {comp.id}
                                        </Typography>
                                        {comp.manufacturerPartNo &&
                                            <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block' }}>
                                                Mfr. Part No: {comp.manufacturerPartNo}
                                            </Typography>
                                        }
                                    </>
                                )}
                            />
                        </ListItem>
                        <Collapse in={true} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 4 }}>
                                {comp.inventory.length > 0 ? comp.inventory.map(invItem => (
                                    <ListItem key={`${comp.id}-${invItem.stockLocation}`}>
                                        <ListItemText primary={`${getLocationName(invItem.stockLocation)}: ${invItem.quantity}`} />
                                    </ListItem>
                                )) : <ListItem><ListItemText primary="No stock information available." /></ListItem>}
                            </List>
                        </Collapse>
                    </React.Fragment>
                ))}
            </List>
          )}
        </section>
      </Box>
    </Box>
  );
};

export default HomePage;
