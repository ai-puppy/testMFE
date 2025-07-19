import React, { Suspense, lazy, useState } from 'react';
import { CartProvider } from './hooks/useCart';
import ShoppingCart from './components/ShoppingCart';
import { Product } from './types';
import { useCart } from './hooks/useCart';
import './App.css';

// Lazy load remote components with error boundary
const ProductCard = lazy(() => import('inventory/ProductCard'));
const InventoryStatus = lazy(() => import('inventory/InventoryStatus'));

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
class RemoteErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
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

  // Mock products - in real app, these would come from an API
  const products: Product[] = [
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
      stock: 50
    },
    {
      id: '3',
      name: 'USB-C Hub',
      price: 79.99,
      description: '7-in-1 USB-C hub with multiple ports',
      category: 'Accessories',
      image: 'https://via.placeholder.com/200x200/dc3545/ffffff?text=Hub',
      stock: 25
    },
    {
      id: '4',
      name: 'Mechanical Keyboard',
      price: 159.99,
      description: 'RGB mechanical keyboard with cherry switches',
      category: 'Accessories',
      image: 'https://via.placeholder.com/200x200/ffc107/ffffff?text=Keyboard',
      stock: 15
    }
  ];

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
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
              <RemoteErrorBoundary 
                key={product.id}
                fallback={<ProductCardFallback product={product} onAddToCart={handleAddToCart} />}
              >
                <Suspense fallback={<div className="loading">Loading product...</div>}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                  <Suspense fallback={<div>Loading stock...</div>}>
                    <InventoryStatus productId={product.id} stock={product.stock} />
                  </Suspense>
                </Suspense>
              </RemoteErrorBoundary>
            ))}
          </div>
        </section>

        {showCart && (
          <section className="cart-section">
            <ShoppingCart />
          </section>
        )}
      </main>
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