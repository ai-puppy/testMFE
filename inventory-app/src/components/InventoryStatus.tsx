import React from 'react';
import './InventoryStatus.css';

interface InventoryStatusProps {
  productId: string;
  stock: number;
}

const InventoryStatus: React.FC<InventoryStatusProps> = ({ productId, stock }) => {
  const getStockLevel = () => {
    if (stock === 0) return { level: 'out-of-stock', text: 'Out of Stock' };
    if (stock < 5) return { level: 'low', text: `Low Stock (${stock} left)` };
    if (stock < 20) return { level: 'medium', text: `In Stock (${stock} available)` };
    return { level: 'high', text: `In Stock (${stock} available)` };
  };

  const { level, text } = getStockLevel();

  return (
    <div className={`inventory-status ${level}`}>
      <span className="status-dot"></span>
      <span className="status-text">{text}</span>
      <span className="status-badge">Live from Inventory</span>
    </div>
  );
};

export default InventoryStatus;