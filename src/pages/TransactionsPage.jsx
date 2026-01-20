
import React, { useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const [componentId, setComponentId] = useState('');
  const [componentData, setComponentData] = useState(null);
  const [addStock, setAddStock] = useState('');
  const [useStock, setUseStock] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!componentId) return;
    setLoading(true);
    setError(null);
    setComponentData(null);

    try {
      const docRef = doc(db, 'components', componentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setComponentData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Component not found.');
      }
    } catch (err) {
      setError(`Error fetching component: ${err.message}`);
    }
    setLoading(false);
  };

  const handleStockUpdate = async (amount) => {
    if (!componentData || amount === 0) {
        return;
    }

    const currentQuantity = componentData.quantity || 0;
    const newQuantity = currentQuantity + amount;

    if (newQuantity < 0) {
        setError("Stock can't be negative.");
        return;
    }

    try {
      const docRef = doc(db, 'components', componentId);
      await updateDoc(docRef, {
        quantity: newQuantity,
        lastUpdated: serverTimestamp()
      });
      setComponentData({ ...componentData, quantity: newQuantity });
      setError(null);
    } catch (err) {
        setError(`Error updating stock: ${err.message}`);
    }
  };

  const handleAddStockClick = () => {
    const amount = parseInt(addStock, 10);
    if (isNaN(amount)) return;
    handleStockUpdate(amount);
    setAddStock('');
  };

  const handleUseStockClick = () => {
    const amount = parseInt(useStock, 10);
    if (isNaN(amount)) return;
    handleStockUpdate(-amount);
    setUseStock('');
  };

  return (
    <div className="transactions-page-container">
      <h1 className="transactions-title">Component Transactions</h1>
      
      <div className="transactions-search-bar">
        <input
          type="text"
          placeholder="Enter Component ID"
          value={componentId}
          onChange={(e) => setComponentId(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="transactions-error-message">{error}</p>}

      {componentData && (
        <div className="transactions-component-details">
          <div className="transactions-component-header">
            <h2>{componentData.name}</h2>
            <p>Manufacturer: {componentData.manufacturer} | Category: {componentData.category}</p>
          </div>

          <div className="transactions-stock-display">
            <h3>Available Stock</h3>
            <p className="stock-quantity">{componentData.quantity || 0}</p>
          </div>

          <div className="transactions-stock-actions">
            <div>
              <h4>Add Stock</h4>
              <input 
                type="number"
                placeholder="Quantity" 
                value={addStock}
                onChange={(e) => setAddStock(e.target.value)}
              />
              <button onClick={handleAddStockClick} className="add-stock-btn">Add</button>
            </div>
            <div>
              <h4>Use Component</h4>
              <input 
                type="number" 
                placeholder="Quantity" 
                value={useStock}
                onChange={(e) => setUseStock(e.target.value)}
              />
              <button onClick={handleUseStockClick} className="use-stock-btn">Use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
