# Micro Frontend Demo - Component Sharing

This project demonstrates micro frontend architecture using Module Federation in Webpack 5, showcasing bidirectional component sharing between two independent React applications.

## Project Structure

```
testMFE/
├── store-app/          # Host application (E-commerce store)
├── inventory-app/      # Remote application (Inventory management)
└── run-apps.sh        # Script to run both apps together
```

## Key Features

### Store App (Port 3000)
- **Consumes from Inventory App:**
  - `ProductCard` component
  - `InventoryStatus` component
- **Exposes to Inventory App:**
  - `ShoppingCart` component
  - `useCart` hook for cart state management

### Inventory App (Port 3001)
- **Exposes to Store App:**
  - `ProductCard` component with inventory styling
  - `InventoryStatus` component showing real-time stock levels
- **Consumes from Store App:**
  - `ShoppingCart` component (demonstrates bidirectional sharing)

## How Component Sharing Works

### 1. Module Federation Configuration

Each app has a webpack configuration that defines:
- **name**: Unique identifier for the app
- **exposes**: Components/modules this app shares
- **remotes**: Other apps this app can consume from
- **shared**: Dependencies that should be shared (React, React-DOM)

### 2. Runtime Loading

Components are loaded dynamically at runtime:
```typescript
const ProductCard = lazy(() => import('inventory/ProductCard'));
```

### 3. Type Safety

TypeScript declarations ensure type safety across micro frontends:
```typescript
declare module 'inventory/ProductCard' {
  // Type definitions
}
```

### 4. Error Boundaries

Fallback components ensure the app works even if remote components fail to load.

## Running the Applications

### Option 1: Run Both Apps Together
```bash
./run-apps.sh
```

### Option 2: Run Apps Individually

Terminal 1:
```bash
cd store-app
npm start
```

Terminal 2:
```bash
cd inventory-app
npm start
```

## Learning Points

1. **Independence**: Each app can be developed, tested, and deployed independently
2. **Runtime Integration**: Components are shared at runtime, not build time
3. **Fallback Handling**: Apps remain functional even if remote components are unavailable
4. **Bidirectional Sharing**: Apps can both expose and consume components
5. **Shared State**: Demonstrates how to share state (cart) across micro frontends

## What to Try

1. **Start only one app**: See how fallback components work
2. **Modify a component**: Changes reflect immediately in consuming apps
3. **Add new exposed components**: Update webpack config and types
4. **Simulate failures**: Disconnect one app to see error boundaries in action

## Architecture Benefits

- **Team Autonomy**: Different teams can own different apps
- **Technology Flexibility**: Each app could use different frameworks (with adapters)
- **Independent Deployments**: Deploy apps separately without coordination
- **Scalability**: Add new micro frontends without modifying existing ones