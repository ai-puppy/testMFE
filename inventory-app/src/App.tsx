import React, { Suspense, lazy, useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import InventoryStatus from './components/InventoryStatus';
import DebugPanel from './components/DebugPanel';
import { Product } from './types';
import { inventorySync } from './services/inventorySync';
import { INITIAL_INVENTORY } from './config/initialInventory';
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
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop',
    stock: INITIAL_INVENTORY['1']
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    price: 49.99,
    description: 'Ergonomic wireless mouse with precision tracking',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop',
    stock: INITIAL_INVENTORY['2']
  },
  {
    id: '3',
    name: 'USB-C Hub',
    price: 79.99,
    description: '7-in-1 USB-C hub with multiple ports',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=200&h=200&fit=crop',
    stock: INITIAL_INVENTORY['3']
  },
  {
    id: '4',
    name: 'Mechanical Keyboard',
    price: 159.99,
    description: 'RGB mechanical keyboard with cherry switches',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop',
    stock: INITIAL_INVENTORY['4']
  },
  {
    id: '5',
    name: 'Monitor 4K',
    price: 599.99,
    description: '27-inch 4K IPS monitor with HDR',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&h=200&fit=crop',
    stock: INITIAL_INVENTORY['5']
  }
];

const App: React.FC = () => {
  const [inventory, setInventory] = useState(mockInventory);
  const [showStoreCart, setShowStoreCart] = useState(false);

  // Initialize and sync inventory state
  useEffect(() => {
    // Check if inventory state already exists in localStorage
    const existingInventory = inventorySync.getInventory();
    
    if (Object.keys(existingInventory).length === 0) {
      // No existing inventory, save our initial state
      const initialInventory: Record<string, number> = {};
      inventory.forEach(product => {
        initialInventory[product.id] = product.stock;
      });
      inventorySync.saveInventory(initialInventory);
    } else {
      // Use existing inventory state
      setInventory(prevInventory => 
        prevInventory.map(product => ({
          ...product,
          stock: existingInventory[product.id] !== undefined ? existingInventory[product.id] : product.stock
        }))
      );
    }

    // Subscribe to inventory updates from other apps
    const unsubscribe = inventorySync.subscribe((event) => {
      console.log('Inventory App: Received inventory update', event);
      
      if (event.productId === 'all') {
        // Full inventory refresh
        const savedInventory = inventorySync.getInventory();
        setInventory(prevInventory => 
          prevInventory.map(product => ({
            ...product,
            stock: savedInventory[product.id] !== undefined ? savedInventory[product.id] : product.stock
          }))
        );
      } else {
        // Single product update
        setInventory(prevInventory => 
          prevInventory.map(product => 
            product.id === event.productId 
              ? { ...product, stock: event.stock }
              : product
          )
        );
      }
    });

    return unsubscribe;
  }, []);

  const updateStock = (productId: string, change: number) => {
    const product = inventory.find(p => p.id === productId);
    if (product) {
      const newStock = Math.max(0, product.stock + change);
      // Use the sync service to update inventory (handles everything)
      inventorySync.updateInventory(productId, newStock);
    }
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
      <DebugPanel />
    </div>
  );
};

export default App;