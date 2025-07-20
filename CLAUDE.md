# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Micro Frontend demonstration using Webpack 5's Module Federation, showcasing bidirectional component sharing between two independent React applications. Both apps can act as hosts and remotes simultaneously.

## Architecture

### Applications
- **Store App (Port 3000)**: E-commerce store application
  - Exposes: `ShoppingCart` component, `useCart` hook
  - Consumes: `ProductCard`, `InventoryStatus` from Inventory App
  
- **Inventory App (Port 3001)**: Inventory management application
  - Exposes: `ProductCard`, `InventoryStatus` components
  - Consumes: `ShoppingCart`, `useCart` from Store App

### Key Architectural Patterns

1. **Bootstrap Pattern**: All apps use `index.tsx` → `bootstrap.tsx` pattern for async module loading
2. **Cross-App State Sync**: Uses `inventorySync` service with localStorage and custom events for real-time updates
3. **Remote Type Declarations**: Each app declares types for consumed components in `remoteTypes.d.ts`
4. **Error Boundaries**: Fallback components ensure apps work even if remotes are unavailable

## Development Commands

### Running Applications
```bash
# Run both apps together (recommended)
./run-apps.sh

# Run individually
cd store-app && npm start    # Runs on http://localhost:3000
cd inventory-app && npm start # Runs on http://localhost:3001
```

### Building
```bash
cd store-app && npm run build
cd inventory-app && npm run build
```

### Installing Dependencies
```bash
# Install for both apps
cd store-app && npm install
cd inventory-app && npm install
```

## Module Federation Configuration

Both apps have similar webpack configurations with Module Federation plugin:
- **name**: Unique identifier for the app
- **filename**: 'remoteEntry.js' - entry point for remote consumption
- **exposes**: Components/modules this app shares
- **remotes**: Other apps this app can consume from
- **shared**: Singleton dependencies (React, React-DOM)

## Important Files and Patterns

### Component Consumption Pattern
```typescript
// Dynamic import with error handling
const RemoteComponent = lazy(() => 
  import('remoteName/ComponentName')
    .catch(() => ({ default: FallbackComponent }))
);

// Usage with Suspense
<Suspense fallback={<Loading />}>
  <RemoteComponent />
</Suspense>
```

### State Synchronization
The `inventorySync` service (in both apps) handles cross-app state updates:
- Updates localStorage with inventory state
- Broadcasts changes via custom events
- Listens for storage events from other windows/tabs

### CSS Handling
- CSS is automatically bundled with exposed components
- Uses app-specific prefixes to avoid conflicts (e.g., `inventory-`, `store-`)
- style-loader injects CSS at runtime

## Development Considerations

1. **CORS**: Both apps have CORS headers configured for cross-origin requests
2. **Hot Reload**: Works within each app but changes to exposed components require consuming app refresh
3. **TypeScript**: Remote types must be declared in `remoteTypes.d.ts`
4. **Dependencies**: Shared dependencies (React) must have matching versions

## Testing Component Sharing

1. Start only one app to see fallback components in action
2. Modify an exposed component to see changes in consuming app (requires refresh)
3. Test state synchronization by updating inventory in one app and observing changes in the other
4. Open multiple browser tabs to test cross-tab synchronization