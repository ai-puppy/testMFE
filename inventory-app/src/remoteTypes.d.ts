declare module 'store/ShoppingCart' {
  import { FC } from 'react';
  
  const ShoppingCart: FC;
  export default ShoppingCart;
}

declare module 'store/useCart' {
  import { FC, ReactNode } from 'react';
  import { Product, Cart } from './types';
  
  interface CartContextType {
    cart: Cart;
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
  }
  
  export const CartProvider: FC<{ children: ReactNode }>;
  export const useCart: () => CartContextType;
}