import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'components'), (snapshot) => {
      const componentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setComponents(componentsData);
      const uniqueCategories = [...new Set(componentsData.map(c => c.category))];
      setCategories(uniqueCategories);
    });
    return () => unsubscribe();
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const componentsForSelectedCategory = selectedCategory
    ? components.filter(c => c.category === selectedCategory)
    : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {categories.map((category, index) => (
          <Box
            key={index}
            onClick={() => handleCategoryClick(category)}
            sx={{
              padding: '10px 20px',
              backgroundColor: selectedCategory === category ? '#e0e2e5' : '#f0f2f5',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              '&:hover': {
                backgroundColor: '#e0e2e5',
              },
            }}
          >
            <Typography variant="body1">{category}</Typography>
          </Box>
        ))}
      </Box>
      {selectedCategory && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>{selectedCategory} Components</Typography>
          {componentsForSelectedCategory.map(component => (
            <Box key={component.id} p={1} mb={1} sx={{ border: '1px solid #ddd', borderRadius: '4px' }}>
              <Typography>ID: {component.id}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CategoryList;
