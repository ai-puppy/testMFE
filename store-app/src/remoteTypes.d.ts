declare module 'inventory/ProductCard' {
  import { FC } from 'react';
  import { Product } from './types';
  
  interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
  }
  
  const ProductCard: FC<ProductCardProps>;
  export default ProductCard;
}

declare module 'inventory/InventoryStatus' {
  import { FC } from 'react';
  
  interface InventoryStatusProps {
    productId: string;
    stock: number;
  }
  
  const InventoryStatus: FC<InventoryStatusProps>;
  export default InventoryStatus;
}