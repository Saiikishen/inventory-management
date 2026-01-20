import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryList from '../components/CategoryList';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './HomePage.css';

const HomePage = () => {
  const [components, setComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'components'), (snapshot) => {
      const componentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setComponents(componentsData);
    });
    return () => unsubscribe();
  }, []);

  const filteredComponents = useMemo(() => {
    if (searchQuery === '') {
      return []; // Clear results when search is empty
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return components.filter(component =>
      (component.name && component.name.toLowerCase().includes(lowercasedQuery)) ||
      (component.category && component.category.toLowerCase().includes(lowercasedQuery)) ||
      (component.id && component.id.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery, components]);

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
            Search Components
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for a component by name, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {searchQuery && (
            <Box mt={2}>
              {filteredComponents.length > 0 ? (
                filteredComponents.map(component => (
                  <Box key={component.id} p={1} mb={1} sx={{ border: '1px solid #ddd', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{component.name} ({component.id})</Typography>
                    <Typography>Stock: {component.quantity || 0}</Typography>
                  </Box>
                ))
              ) : (
                <Typography mt={2}>No components found.</Typography>
              )}
            </Box>
          )}
        </section>
        <section className="home-category-section">
          <Typography variant="h4" component="h2" gutterBottom>
            Browse by Category
          </Typography>
          <CategoryList />
        </section>
      </Box>
    </Box>
  );
};

export default HomePage;
