# Micro Frontends Explanation - Component Sharing Feature

## Table of Contents
1. [How Micro Frontends Work in This Implementation](#how-micro-frontends-work-in-this-implementation)
2. [CSS and Styling in Micro Frontends](#css-and-styling-in-micro-frontends)
3. [Backend Operations in Micro Frontends](#backend-operations-in-micro-frontends)
4. [Best Practices](#best-practices)

## How Micro Frontends Work in This Implementation

### 1. Architecture Overview

In this implementation, we have two separate React applications that demonstrate micro frontend architecture:

- **Store App** (Port 3000) - Acts as both host and remote
  - Exposes: `ShoppingCart` component, `useCart` hook
  - Consumes: `ProductCard`, `InventoryStatus` from Inventory App

- **Inventory App** (Port 3001) - Acts as both host and remote
  - Exposes: `ProductCard`, `InventoryStatus` components
  - Consumes: `ShoppingCart`, `useCart` from Store App

Each application:
- Runs independently on its own port
- Has its own webpack dev server
- Can be developed and deployed separately
- Shares components at runtime (not build time)

### 2. Module Federation Configuration

Module Federation is a Webpack 5 feature that enables runtime sharing of code between independent applications.

#### Store App Configuration (webpack.config.js)
```javascript
new ModuleFederationPlugin({
  name: 'store',                    // Unique name for this app
  filename: 'remoteEntry.js',       // Entry point for remote consumption
  exposes: {
    // Components this app shares with others
    './ShoppingCart': './src/components/ShoppingCart',
    './useCart': './src/hooks/useCart',
  },
  remotes: {
    // Other apps this app can consume from
    inventory: 'inventory@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    // Dependencies that should be shared (singleton)
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
})
```

#### Inventory App Configuration
```javascript
new ModuleFederationPlugin({
  name: 'inventory',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductCard': './src/components/ProductCard',
    './InventoryStatus': './src/components/InventoryStatus',
  },
  remotes: {
    store: 'store@http://localhost:3000/remoteEntry.js',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
})
```

### 3. How Component Sharing Works

#### Step 1: Exposing Components
When you expose a component:
1. Webpack creates a `remoteEntry.js` file
2. This file acts as a manifest of available components
3. It includes the code needed to load components on demand

#### Step 2: Consuming Components
```typescript
// In Store App - consuming from Inventory App
const ProductCard = lazy(() => 
  import('inventory/ProductCard')
    .catch(err => {
      console.error('Failed to load ProductCard:', err);
      // Return fallback component
      return { default: FallbackComponent };
    })
);
```

#### Step 3: Runtime Loading Process
1. Browser loads Store App from `http://localhost:3000`
2. When it encounters `import('inventory/ProductCard')`:
   - Fetches `http://localhost:3001/remoteEntry.js`
   - Downloads the ProductCard component code
   - Executes and renders it within Store App

### 4. The Bootstrap Pattern

Module Federation requires asynchronous boundaries for proper initialization:

#### index.tsx
```typescript
// Dynamic import creates async boundary
import('./bootstrap');
```

#### bootstrap.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Normal React app initialization
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

This pattern ensures:
- Shared modules are properly initialized
- Dependencies are resolved before app starts
- No race conditions with shared libraries

### 5. Cross-App State Synchronization

The implementation uses a custom service for real-time state sync:

```typescript
// inventorySync.ts key methods
class InventorySync {
  updateInventory(productId: string, stock: number): void {
    // 1. Update localStorage
    const inventory = this.getInventory();
    inventory[productId] = stock;
    localStorage.setItem('inventory-state', JSON.stringify(inventory));
    
    // 2. Broadcast update event
    const updateKey = `inventory-update-${Date.now()}`;
    localStorage.setItem(updateKey, JSON.stringify({
      productId,
      stock,
      timestamp: Date.now()
    }));
    
    // 3. Notify local subscribers
    this.notifySubscribers({ productId, stock, timestamp: Date.now() });
    
    // 4. Clean up after other windows process
    setTimeout(() => localStorage.removeItem(updateKey), 500);
  }
}
```

## CSS and Styling in Micro Frontends

### How CSS Works with Exported Components

When you export a component through Module Federation, **the CSS is automatically included**. Here's how it works:

### 1. CSS Import in Components

When a component imports CSS:
```typescript
// ProductCard.tsx
import React from 'react';
import './ProductCard.css';  // This CSS will be bundled with the component

const ProductCard: React.FC = () => {
  return <div className="inventory-product-card">...</div>;
};
```

### 2. Webpack CSS Configuration

The webpack configuration handles CSS bundling:
```javascript
module: {
  rules: [
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
  ],
}
```

- **css-loader**: Resolves CSS imports and processes the CSS
- **style-loader**: Injects CSS into the DOM at runtime (creates `<style>` tags)

### 3. What Gets Bundled

When you expose a component, the bundle includes:
- ✅ Component JavaScript/TypeScript code
- ✅ CSS styles imported by the component
- ✅ Images and assets imported by the component
- ✅ Any internal dependencies

### 4. Runtime CSS Injection

When Store App loads ProductCard from Inventory App:

1. **Initial Load**: Store App renders its own components and styles
2. **Dynamic Import**: `import('inventory/ProductCard')` is executed
3. **CSS Injection**: style-loader injects ProductCard.css into the DOM
4. **Component Render**: ProductCard renders with its styles applied

```html
<!-- This gets injected into the <head> at runtime -->
<style>
.inventory-product-card {
  background: white;
  border-radius: 8px;
  /* ... all ProductCard styles ... */
}
</style>
```

### 5. CSS Isolation Strategies

Since CSS is global by default, you need strategies to prevent conflicts:

#### a) **Unique Prefixes (Current Implementation)**
```css
/* Use app-specific prefixes */
.inventory-product-card { /* inventory- prefix */
  background: white;
}

.store-shopping-cart { /* store- prefix */
  border: 1px solid #ddd;
}
```

#### b) **CSS Modules**
```javascript
// webpack.config.js
{
  test: /\.module\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  ]
}
```

```typescript
// Component using CSS Modules
import styles from './ProductCard.module.css';

const ProductCard = () => (
  <div className={styles.card}>...</div>
);
```

#### c) **CSS-in-JS Solutions**
```typescript
import styled from 'styled-components';

const ProductCardWrapper = styled.div`
  background: white;
  border-radius: 8px;
  /* Styles are scoped to this component */
`;
```

#### d) **Shadow DOM (Advanced)**
```typescript
class ProductCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    // CSS is completely isolated within shadow DOM
  }
}
```

### 6. CSS Loading Order

Understanding the order is crucial:

1. **Host App CSS** loads first (Store App styles)
2. **Remote Component CSS** loads when component is imported
3. **Last loaded CSS wins** in case of conflicts

### 7. Production Considerations

For production, you might want to:

#### a) **Extract CSS to separate files**
```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module: {
  rules: [{
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader, // Instead of style-loader
      'css-loader'
    ]
  }]
},
plugins: [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css'
  })
]
```

#### b) **Implement CSS optimization**
```javascript
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

optimization: {
  minimizer: [
    new CssMinimizerPlugin(),
  ],
}
```

### 8. Real Example from Implementation

Looking at ProductCard.css:
```css
.inventory-product-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #17a2b8;
  color: white;
}
```

When Store App uses ProductCard:
- These styles are automatically applied
- The "From Inventory App" badge appears correctly styled
- No manual CSS import needed in Store App
- Styles work identically to how they work in Inventory App

### 9. Debugging CSS in Micro Frontends

To debug CSS issues:

1. **Check browser DevTools**
   - Inspect element to see applied styles
   - Look for injected `<style>` tags in `<head>`

2. **Use unique identifiers**
   ```css
   /* Add data attributes for debugging */
   [data-mfe="inventory"] .product-card {
     /* Inventory app specific styles */
   }
   ```

3. **Log CSS loading**
   ```typescript
   const ProductCard = lazy(() => 
     import('inventory/ProductCard')
       .then(module => {
         console.log('ProductCard CSS loaded');
         return module;
       })
   );
   ```

### CSS Best Practices for Micro Frontends

1. **Use naming conventions**: Prefix classes with app name
2. **Avoid global styles**: Don't style generic elements like `body`, `h1`
3. **Document CSS dependencies**: Make it clear what styles a component expects
4. **Consider CSS-in-JS**: For better isolation
5. **Test in isolation**: Ensure components look correct when used alone
6. **Version your styles**: Consider how style changes affect consumers

## Backend Operations in Micro Frontends

### Your Question: How do backend operations work when exposing components?

This is an excellent question! When you expose a component that needs backend operations, you have several patterns to handle this:

### 1. Backend Services Remain with the Owning Application

**Most Common Pattern**: The backend services stay with the micro frontend that owns the component.

```typescript
// In Inventory App's ProductCard component
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const updateProductDetails = async (productId: string, updates: any) => {
    // This API call goes to Inventory App's backend
    const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  };

  return (
    <div className="product-card">
      {/* Component UI */}
    </div>
  );
};
```

**Key Points:**
- The component makes API calls to its own backend (port 3001)
- CORS must be configured to allow cross-origin requests
- Authentication tokens need to be handled properly

### 2. API Gateway Pattern

Use a central API gateway that routes to appropriate backend services:

```typescript
// Centralized API configuration
const API_GATEWAY = 'http://localhost:8080/api';

// In any micro frontend
const fetchProduct = async (productId: string) => {
  // Gateway routes /inventory/* to Inventory service
  return fetch(`${API_GATEWAY}/inventory/products/${productId}`);
};
```

### 3. Passing API Functions as Props

The host application can provide API functions to remote components:

```typescript
// Store App provides the API function
const handleInventoryUpdate = async (productId: string, stock: number) => {
  // Store App handles the API call with its own authentication
  return await storeAPI.updateInventory(productId, stock);
};

// Pass to remote component
<ProductCard 
  product={product} 
  onInventoryUpdate={handleInventoryUpdate}
/>
```

### 4. Shared Services Pattern

Create shared services that multiple micro frontends can use:

```typescript
// Shared inventory service (could be another exposed module)
export class InventoryAPIService {
  private baseURL: string;
  private authToken: string;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL;
    this.authToken = config.authToken;
  }

  async updateStock(productId: string, stock: number) {
    return fetch(`${this.baseURL}/api/inventory/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stock })
    });
  }
}

// Expose this service through Module Federation
exposes: {
  './ProductCard': './src/components/ProductCard',
  './InventoryService': './src/services/InventoryAPIService'
}
```

### 5. Event-Driven Communication

Use events for backend operations without tight coupling:

```typescript
// ProductCard emits events instead of making direct API calls
const ProductCard: React.FC = ({ product }) => {
  const handleStockUpdate = () => {
    // Emit custom event
    window.dispatchEvent(new CustomEvent('inventory:update', {
      detail: { productId: product.id, action: 'decrease', amount: 1 }
    }));
  };

  return <div>...</div>;
};

// Host app listens and handles the backend call
window.addEventListener('inventory:update', async (event) => {
  const { productId, action, amount } = event.detail;
  await inventoryAPI.updateStock(productId, action, amount);
});
```

## Best Practices

### 1. Authentication and Authorization

```typescript
// Share auth state through a common auth service
const AuthContext = React.createContext<AuthState>();

// Each micro frontend checks auth
const ProductCard: React.FC = () => {
  const auth = useContext(AuthContext);
  
  const updateProduct = async () => {
    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    });
  };
};
```

### 2. Error Handling

```typescript
// Graceful degradation when backend is unavailable
const ProductCard: React.FC = ({ product, fallbackData }) => {
  const [data, setData] = useState(product);
  const [error, setError] = useState(null);

  const fetchLatestData = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      setData(await response.json());
    } catch (err) {
      setError(err);
      // Use fallback data if provided
      if (fallbackData) setData(fallbackData);
    }
  };
};
```

### 3. Configuration Management

```typescript
// Environment-specific configuration
const config = {
  development: {
    inventoryAPI: 'http://localhost:3001',
    storeAPI: 'http://localhost:3000'
  },
  production: {
    inventoryAPI: 'https://api.inventory.example.com',
    storeAPI: 'https://api.store.example.com'
  }
};

// Use in components
const apiBase = config[process.env.NODE_ENV].inventoryAPI;
```

### 4. Caching and Performance

```typescript
// Implement caching for shared data
const useProductData = (productId: string) => {
  const cacheKey = `product-${productId}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  const [data, setData] = useState(cached ? JSON.parse(cached) : null);
  
  useEffect(() => {
    if (!cached) {
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        });
    }
  }, [productId]);
  
  return data;
};
```

## Summary

When exposing components in micro frontends:

1. **Components are self-contained** - They bring their own UI logic
2. **Backend services typically stay with the owning app** - The component knows how to call its own backend
3. **Cross-origin requests must be handled** - CORS configuration is essential
4. **Authentication needs coordination** - Shared auth strategies are important
5. **Multiple patterns exist** - Choose based on your architecture needs

The key insight is that **you don't expose backend code directly**. Instead, the exposed component contains the logic to communicate with its backend, or you provide mechanisms (props, events, shared services) for the host application to handle backend operations.