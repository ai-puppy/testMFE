import React, { Suspense, lazy, useState, useEffect } from 'react';
import { CartProvider } from './hooks/useCart';
import ShoppingCart from './components/ShoppingCart';
import DebugPanel from './components/DebugPanel';
import { Product } from './types';
import { useCart } from './hooks/useCart';
import { inventorySync } from './services/inventorySync';
import { INITIAL_INVENTORY } from './config/initialInventory';
import './App.css';

// Lazy load remote components with error handling and logging
const ProductCard = lazy(() => 
  import('inventory/ProductCard')
    .then(module => {
      console.log('ProductCard loaded successfully from inventory app');
      return module;
    })
    .catch(err => {
      console.error('Failed to load ProductCard from inventory app:', err);
      throw err;
    })
);

const InventoryStatus = lazy(() => 
  import('inventory/InventoryStatus')
    .then(module => {
      console.log('InventoryStatus loaded successfully from inventory app');
      return module;
    })
    .catch(err => {
      console.error('Failed to load InventoryStatus from inventory app:', err);
      throw err;
    })
);

// Fallback component when remote is not available
const ProductCardFallback: React.FC<{ product: Product; onAddToCart?: (product: Product) => void }> = ({ product, onAddToCart }) => (
  <div className="product-card fallback">
    <img src={product.image} alt={product.name} />
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <p className="price">${product.price.toFixed(2)}</p>
    <button onClick={() => onAddToCart?.(product)}>Add to Cart</button>
    <p className="fallback-notice">Using local component</p>
  </div>
);

// Error boundary for remote components
class RemoteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    console.error('RemoteErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return this.props.children;
  }
}

const StoreContent: React.FC = () => {
  const { addToCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<Product[]>([
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
    }
  ]);

  // Initialize inventory state on first render only
  useEffect(() => {
    // Load initial inventory state
    const savedInventory = inventorySync.getInventory();
    if (Object.keys(savedInventory).length > 0) {
      setProducts(prevProducts => 
        prevProducts.map(product => ({
          ...product,
          stock: savedInventory[product.id] !== undefined ? savedInventory[product.id] : product.stock
        }))
      );
    }
  }, []); // Empty array is OK here since we only want to load saved state once

  // Save initial inventory state if none exists
  useEffect(() => {
    const savedInventory = inventorySync.getInventory();
    if (Object.keys(savedInventory).length === 0) {
      const initialInventory: Record<string, number> = {};
      products.forEach(product => {
        initialInventory[product.id] = product.stock;
      });
      inventorySync.saveInventory(initialInventory);
    }
  }, []); // This only runs once on mount

  // Subscribe to inventory updates
  useEffect(() => {
    const unsubscribe = inventorySync.subscribe((event) => {
      console.log('Store App: Received inventory update', event);
      
      if (event.productId === 'all') {
        // Full inventory refresh
        const savedInventory = inventorySync.getInventory();
        setProducts(prevProducts => 
          prevProducts.map(product => ({
            ...product,
            stock: savedInventory[product.id] !== undefined ? savedInventory[product.id] : product.stock
          }))
        );
      } else {
        // Single product update
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === event.productId 
              ? { ...product, stock: event.stock }
              : product
          )
        );
      }
    });

    return unsubscribe;
  }, []); // Subscription doesn't need dependencies

  const handleAddToCart = (product: Product) => {
    if (product.stock > 0) {
      addToCart(product, 1);
      
      // Update inventory using the sync service (this will handle everything)
      inventorySync.updateInventory(product.id, product.stock - 1);
      
      alert(`${product.name} added to cart!`);
    } else {
      alert(`${product.name} is out of stock!`);
    }
  };

  return (
    <div className="store-app">
      <header>
        <h1>Store App - Micro Frontend Host</h1>
        <button 
          className="cart-toggle"
          onClick={() => setShowCart(!showCart)}
        >
          {showCart ? 'Hide Cart' : 'Show Cart'}
        </button>
      </header>

      <main>
        <section className="info-section">
          <h2>About This Demo</h2>
          <p>This is the <strong>Store App</strong> (Host) running on port 3000.</p>
          <p>It demonstrates:</p>
          <ul>
            <li>✅ Consuming <code>ProductCard</code> component from Inventory App</li>
            <li>✅ Consuming <code>InventoryStatus</code> component from Inventory App</li>
            <li>✅ Exposing <code>ShoppingCart</code> component to other apps</li>
            <li>✅ Exposing <code>useCart</code> hook for shared state</li>
            <li>✅ Error boundaries with fallback components</li>
          </ul>
        </section>

        <section className="products-section">
          <h2>Products (Components from Inventory App)</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-item-wrapper">
                <RemoteErrorBoundary 
                  fallback={<ProductCardFallback product={product} onAddToCart={handleAddToCart} />}
                >
                  <Suspense fallback={<div className="loading">Loading product...</div>}>
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </Suspense>
                </RemoteErrorBoundary>
                <RemoteErrorBoundary 
                  fallback={
                    <div className="inventory-fallback">
                      <span className="status-dot"></span>
                      <span>Stock: {product.stock} (Fallback)</span>
                    </div>
                  }
                >
                  <Suspense fallback={<div className="loading-status">Loading inventory status...</div>}>
                    <InventoryStatus productId={product.id} stock={product.stock} />
                  </Suspense>
                </RemoteErrorBoundary>
              </div>
            ))}
          </div>
        </section>

        {showCart && (
          <section className="cart-section">
            <ShoppingCart />
          </section>
        )}
      </main>
      <DebugPanel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  );
};

export default App;