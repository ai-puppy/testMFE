import React, { useState, useEffect } from 'react';
import { inventorySync } from '../services/inventorySync';
import './DebugPanel.css';

const DebugPanel: React.FC = () => {
  const [inventoryState, setInventoryState] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setInventoryState(inventorySync.getInventory());
    };

    updateState();
    
    // Update every second
    const interval = setInterval(updateState, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const clearInventory = () => {
    localStorage.removeItem('inventory-state');
    localStorage.removeItem('inventory-update');
    setInventoryState({});
    alert('Inventory state cleared! Please refresh both apps.');
  };

  return (
    <div className="debug-panel">
      <button 
        className="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide' : 'Show'} Debug Panel
      </button>
      
      {isOpen && (
        <div className="debug-content">
          <h3>Inventory Sync State</h3>
          <div className="inventory-state">
            {Object.entries(inventoryState).map(([id, stock]) => (
              <div key={id} className="state-item">
                Product {id}: {stock} units
              </div>
            ))}
            {Object.keys(inventoryState).length === 0 && (
              <div className="state-item">No inventory state saved</div>
            )}
          </div>
          <button 
            className="clear-button"
            onClick={clearInventory}
          >
            Clear Inventory State
          </button>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;