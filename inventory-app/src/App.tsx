import React, { Suspense, lazy, useState } from 'react';
import ProductCard from './components/ProductCard';
import InventoryStatus from './components/InventoryStatus';
import { Product } from './types';
import './App.css';

// Lazy load remote components with error handling
const ShoppingCart = lazy(() => 
  import('store/ShoppingCart').catch(() => {
    return { default: () => <div className="error-message">Store App is not running. Please start it on port 3000.</div> };
  })
);

// Create a wrapper component for CartProvider
const CartProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const StoreCartProvider = lazy(() => 
  import('store/useCart')
    .then(module => ({ default: module.CartProvider }))
    .catch(() => ({ default: CartProviderWrapper }))
);

// Mock inventory data
const mockInventory: Product[] = [
  {
    id: '1',
    name: 'Laptop Pro',
    price: 1299.99,
    description: 'High-performance laptop for professionals',
    category: 'Electronics',
    image: 'https://via.placeholder.com/200x200/007bff/ffffff?text=Laptop',
    stock: 10
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    price: 49.99,
    description: 'Ergonomic wireless mouse with precision tracking',
    category: 'Accessories',
    image: 'https://via.placeholder.com/200x200/28a745/ffffff?text=Mouse',
    stock: 3 // Low stock
  },
  {
    id: '3',
    name: 'USB-C Hub',
    price: 79.99,
    description: '7-in-1 USB-C hub with multiple ports',
    category: 'Accessories',
    image: 'https://via.placeholder.com/200x200/dc3545/ffffff?text=Hub',
    stock: 0 // Out of stock
  },
  {
    id: '4',
    name: 'Mechanical Keyboard',
    price: 159.99,
    description: 'RGB mechanical keyboard with cherry switches',
    category: 'Accessories',
    image: 'https://via.placeholder.com/200x200/ffc107/ffffff?text=Keyboard',
    stock: 15
  },
  {
    id: '5',
    name: 'Monitor 4K',
    price: 599.99,
    description: '27-inch 4K IPS monitor with HDR',
    category: 'Electronics',
    image: 'https://via.placeholder.com/200x200/6f42c1/ffffff?text=Monitor',
    stock: 7
  }
];

const App: React.FC = () => {
  const [inventory, setInventory] = useState(mockInventory);
  const [showStoreCart, setShowStoreCart] = useState(false);

  const updateStock = (productId: string, change: number) => {
    setInventory(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, stock: Math.max(0, product.stock + change) }
          : product
      )
    );
  };

  return (
    <div className="inventory-app">
      <header>
        <h1>Inventory App - Micro Frontend Remote</h1>
        <button 
          className="cart-toggle"
          onClick={() => setShowStoreCart(!showStoreCart)}
        >
          {showStoreCart ? 'Hide Store Cart' : 'Show Store Cart'}
        </button>
      </header>

      <main>
        <section className="info-section">
          <h2>About This Demo</h2>
          <p>This is the <strong>Inventory App</strong> (Remote) running on port 3001.</p>
          <p>It demonstrates:</p>
          <ul>
            <li>✅ Exposing <code>ProductCard</code> component to Store App</li>
            <li>✅ Exposing <code>InventoryStatus</code> component to Store App</li>
            <li>✅ Consuming <code>ShoppingCart</code> component from Store App</li>
            <li>✅ Real-time inventory management</li>
            <li>✅ Bidirectional component sharing</li>
          </ul>
        </section>

        <section className="inventory-section">
          <h2>Inventory Management</h2>
          <div className="inventory-grid">
            {inventory.map(product => (
              <div key={product.id} className="inventory-item">
                <ProductCard product={product} />
                <InventoryStatus productId={product.id} stock={product.stock} />
                <div className="stock-controls">
                  <button 
                    onClick={() => updateStock(product.id, -1)}
                    disabled={product.stock === 0}
                  >
                    - Decrease
                  </button>
                  <span className="stock-count">{product.stock} units</span>
                  <button onClick={() => updateStock(product.id, 1)}>
                    + Increase
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {showStoreCart && (
          <section className="store-cart-section">
            <h2>Shopping Cart from Store App</h2>
            <Suspense fallback={
              <div className="loading">Loading Store Cart component...</div>
            }>
              <div className="remote-cart-wrapper">
                <Suspense fallback={<div>Loading cart provider...</div>}>
                  <StoreCartProvider>
                    <ShoppingCart />
                  </StoreCartProvider>
                </Suspense>
                <p className="remote-notice">This cart component is loaded from Store App!</p>
              </div>
            </Suspense>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;