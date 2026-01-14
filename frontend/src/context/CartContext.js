import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

// Helper function to safely get cart from localStorage
const getStoredCart = () => {
  try {
    const savedCart = localStorage.getItem('doggyBakeryCart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      // Validate it's an array
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return [];
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize state synchronously from localStorage using lazy initializer
  const [cartItems, setCartItems] = useState(() => getStoredCart());
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Track if initial mount is complete to prevent overwriting localStorage on first render
  const isInitialMount = useRef(true);

  // Save cart to localStorage whenever it changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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
