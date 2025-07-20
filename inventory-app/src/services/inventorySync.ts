// Inventory synchronization service using custom events
export interface InventoryUpdateEvent {
  productId: string;
  stock: number;
  timestamp: number;
}

class InventorySync {
  private static instance: InventorySync;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
    
    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', (e) => {
      // Check for inventory update events (with timestamp)
      if (e.key && e.key.startsWith('inventory-update-') && e.newValue) {
        console.log('InventorySync: Received storage event', e.key);
        try {
          const update = JSON.parse(e.newValue);
          this.notifySubscribers(update);
        } catch (err) {
          console.error('InventorySync: Failed to parse update', err);
        }
      }
      
      // Also listen for direct inventory-state changes
      if (e.key === 'inventory-state' && e.newValue) {
        console.log('InventorySync: Inventory state changed externally');
        // Trigger a full refresh event
        this.notifySubscribers({
          productId: 'all',
          stock: -1,
          timestamp: Date.now()
        });
      }
    });
  }

  static getInstance(): InventorySync {
    if (!InventorySync.instance) {
      InventorySync.instance = new InventorySync();
    }
    return InventorySync.instance;
  }

  // Update inventory and notify all subscribers
  updateInventory(productId: string, stock: number): void {
    const update: InventoryUpdateEvent = {
      productId,
      stock,
      timestamp: Date.now()
    };

    // Update the actual inventory state
    const currentInventory = this.getInventory();
    currentInventory[productId] = stock;
    this.saveInventory(currentInventory);

    // Broadcast to other windows/tabs via localStorage
    // Use a unique key with timestamp to ensure event fires
    const updateKey = `inventory-update-${update.timestamp}`;
    localStorage.setItem(updateKey, JSON.stringify(update));
    
    // Notify subscribers in current window
    this.notifySubscribers(update);
    
    // Clean up localStorage after giving time for other windows to process
    setTimeout(() => {
      localStorage.removeItem(updateKey);
    }, 500); // Increased timeout
  }

  // Subscribe to inventory updates
  subscribe(callback: (event: InventoryUpdateEvent) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<InventoryUpdateEvent>;
      callback(customEvent.detail);
    };

    this.eventTarget.addEventListener('inventory-update', handler);

    // Return unsubscribe function
    return () => {
      this.eventTarget.removeEventListener('inventory-update', handler);
    };
  }

  private notifySubscribers(update: InventoryUpdateEvent): void {
    const event = new CustomEvent('inventory-update', { detail: update });
    this.eventTarget.dispatchEvent(event);
  }

  // Get current inventory from localStorage
  getInventory(): Record<string, number> {
    const stored = localStorage.getItem('inventory-state');
    return stored ? JSON.parse(stored) : {};
  }

  // Save inventory state to localStorage
  saveInventory(inventory: Record<string, number>): void {
    localStorage.setItem('inventory-state', JSON.stringify(inventory));
  }
}

export const inventorySync = InventorySync.getInstance();