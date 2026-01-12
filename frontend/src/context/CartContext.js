import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('doggyBakeryCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('doggyBakeryCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedSize, selectedFlavor, quantity = 1) => {
    const itemId = `${product.id}-${selectedSize}-${selectedFlavor}`;
    const existingItem = cartItems.find(item => item.itemId === itemId);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.itemId === itemId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        itemId,
        ...product,
        selectedSize,
        selectedFlavor,
        quantity
      }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.itemId !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(cartItems.map(item =>
        item.itemId === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
