import React from 'react';
import { useCart } from '../hooks/useCart';
import './ShoppingCart.css';

const ShoppingCart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="shopping-cart empty">
        <h2>Shopping Cart</h2>
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.product.id} className="cart-item">
            <img src={item.product.image} alt={item.product.name} />
            <div className="item-details">
              <h3>{item.product.name}</h3>
              <p className="price">${item.product.price.toFixed(2)}</p>
              <div className="quantity-controls">
                <button 
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                >
                  +
                </button>
              </div>
            </div>
            <div className="item-total">
              <p>${(item.product.price * item.quantity).toFixed(2)}</p>
              <button 
                className="remove-btn"
                onClick={() => removeFromCart(item.product.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h3>Total: ${cart.total.toFixed(2)}</h3>
        <button className="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
  );
};

export default ShoppingCart;