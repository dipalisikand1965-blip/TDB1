import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_URL } from '../utils/api';

const CartContext = createContext();

// Autoship discount tiers
const AUTOSHIP_DISCOUNTS = {
  first: { percent: 25, maxAmount: 300 },  // 25% off, max ₹300
  subsequent: { percent: 10, maxAmount: null }  // 10% off subsequent orders
};

// Shipping threshold
const FREE_SHIPPING_THRESHOLD = 3000;
const SHIPPING_COST = 150;

// Helper function to safely get cart from localStorage
const CART_VERSION = 2; // bump this to wipe stale carts on schema changes
const getStoredCart = () => {
  try {
    const savedCart = localStorage.getItem('doggyBakeryCart');
    if (!savedCart) return [];
    const parsed = JSON.parse(savedCart);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem('doggyBakeryCart');
      return [];
    }
    // Version guard — wipe cart if version mismatch
    const savedVersion = localStorage.getItem('doggyBakeryCartVersion');
    if (savedVersion !== String(CART_VERSION)) {
      localStorage.removeItem('doggyBakeryCart');
      localStorage.setItem('doggyBakeryCartVersion', String(CART_VERSION));
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    localStorage.removeItem('doggyBakeryCart');
    return [];
  }
};

// Helper function to get concierge requests from localStorage
const getStoredConciergeRequests = () => {
  try {
    const saved = localStorage.getItem('conciergePendingRequests');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading concierge requests from localStorage:', error);
  }
  return [];
};

// Get or create session ID for cart tracking
const getSessionId = () => {
  let sessionId = localStorage.getItem('cartSessionId');
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cartSessionId', sessionId);
  }
  return sessionId;
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
  const [conciergeRequests, setConciergeRequests] = useState(() => getStoredConciergeRequests());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('cartUserEmail') || '');
  
  // Track if initial mount is complete to prevent overwriting localStorage on first render
  const isInitialMount = useRef(true);
  const snapshotTimeout = useRef(null);

  // Save cart snapshot for abandoned cart tracking
  const saveCartSnapshot = useCallback(async (items) => {
    if (items.length === 0) return;
    
    try {
      const sessionId = getSessionId();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const snapshot = {
        session_id: sessionId,
        user_id: user.id || null,
        email: userEmail || user.email || null,
        phone: user.phone || null,
        name: user.name || null,
        items: items.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.selectedSize || item.selectedFlavor || null,
          image: item.image || null
        })),
        subtotal: items.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
      
      await fetch(`${API_URL}/api/cart/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
    } catch (error) {
      console.error('Error saving cart snapshot:', error);
    }
  }, [userEmail]);

  // Debounced snapshot saving
  const debouncedSaveSnapshot = useCallback((items) => {
    if (snapshotTimeout.current) {
      clearTimeout(snapshotTimeout.current);
    }
    snapshotTimeout.current = setTimeout(() => {
      saveCartSnapshot(items);
    }, 2000); // Wait 2 seconds after last change
  }, [saveCartSnapshot]);

  // Save cart to localStorage and trigger snapshot whenever it changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('doggyBakeryCart', JSON.stringify(cartItems));
    debouncedSaveSnapshot(cartItems);
  }, [cartItems, debouncedSaveSnapshot]);

  // Save concierge requests to localStorage
  useEffect(() => {
    localStorage.setItem('conciergePendingRequests', JSON.stringify(conciergeRequests));
  }, [conciergeRequests]);

  // Capture email for abandoned cart recovery
  const captureEmail = useCallback(async (email, name = null) => {
    setUserEmail(email);
    localStorage.setItem('cartUserEmail', email);
    
    try {
      const sessionId = getSessionId();
      await fetch(`${API_URL}/api/cart/capture-email?session_id=${sessionId}&email=${encodeURIComponent(email)}${name ? `&name=${encodeURIComponent(name)}` : ''}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error capturing email:', error);
    }
  }, []);

  // Mark cart as converted when order is placed
  const markCartConverted = useCallback(async (orderId) => {
    try {
      const sessionId = getSessionId();
      await fetch(`${API_URL}/api/cart/convert/${sessionId}?order_id=${orderId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking cart converted:', error);
    }
  }, []);

  const addToCart = useCallback((product, selectedSize, selectedFlavor, quantity = 1) => {
    const itemId = `${product.id}-${selectedSize}-${selectedFlavor}`;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.itemId === itemId);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, {
          itemId,
          ...product,
          selectedSize,
          selectedFlavor,
          quantity
        }];
      }
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.itemId !== itemId));
  };

  // Listen for addToCart custom events from Mira and other components
  useEffect(() => {
    const handleAddToCartEvent = (event) => {
      const product = event.detail;
      if (product) {
        addToCart(product, null, null, 1);
      }
    };
    
    window.addEventListener('addToCart', handleAddToCartEvent);
    return () => {
      window.removeEventListener('addToCart', handleAddToCartEvent);
    };
  }, [addToCart]);

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

  // ==================== CONCIERGE REQUEST FUNCTIONS ====================
  
  /**
   * Add a concierge request to the cart
   * @param {Object} request - The concierge request object
   * @param {string} request.pillar - Which pillar (celebrate, dine, etc.)
   * @param {string} request.title - Service title
   * @param {string} request.petName - Pet name
   * @param {string} request.petId - Pet ID
   * @param {string} request.soulReason - Personalization reason
   * @param {string} request.description - Service description
   * @param {string} request.icon - Emoji icon
   */
  const addConciergeRequest = useCallback((request) => {
    const requestId = `concierge-${request.pillar}-${request.petId}-${Date.now()}`;
    
    setConciergeRequests(prev => {
      // Check if similar request already exists
      const exists = prev.some(r => 
        r.pillar === request.pillar && 
        r.petId === request.petId &&
        r.title === request.title
      );
      
      if (exists) {
        return prev; // Don't add duplicate
      }
      
      return [...prev, {
        requestId,
        ...request,
        createdAt: new Date().toISOString(),
        status: 'pending' // pending, submitted, responded
      }];
    });
    
    setIsCartOpen(true);
  }, []);

  const removeConciergeRequest = useCallback((requestId) => {
    setConciergeRequests(prev => prev.filter(r => r.requestId !== requestId));
  }, []);

  const clearConciergeRequests = useCallback(() => {
    setConciergeRequests([]);
  }, []);

  /**
   * Submit all concierge requests - creates tickets and notifies
   */
  const submitConciergeRequests = useCallback(async () => {
    if (conciergeRequests.length === 0) return { success: false, message: 'No requests to submit' };
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const results = [];
      
      for (const request of conciergeRequests) {
        // Create a service desk ticket for each request
        const ticketData = {
          title: `${request.title} for ${request.petName}`,
          description: `${request.soulReason}\n\n${request.description}`,
          pillar: request.pillar,
          pet_id: request.petId,
          pet_name: request.petName,
          source: 'concierge_cart',
          priority: 'normal',
          type: 'concierge_request',
          status: 'open'
        };
        
        const response = await fetch(`${API_URL}/api/tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(ticketData)
        });
        
        if (response.ok) {
          const ticket = await response.json();
          results.push({ success: true, requestId: request.requestId, ticketId: ticket.id || ticket.ticket_id });
        } else {
          results.push({ success: false, requestId: request.requestId, error: 'Failed to create ticket' });
        }
      }
      
      // Clear submitted requests
      const successfulIds = results.filter(r => r.success).map(r => r.requestId);
      setConciergeRequests(prev => prev.filter(r => !successfulIds.includes(r.requestId)));
      
      return { 
        success: true, 
        message: `${successfulIds.length} concierge request(s) submitted`,
        tickets: results.filter(r => r.success)
      };
    } catch (error) {
      console.error('Error submitting concierge requests:', error);
      return { success: false, message: error.message };
    }
  }, [conciergeRequests]);

  const getConciergeCount = useCallback(() => {
    return conciergeRequests.length;
  }, [conciergeRequests]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Calculate autoship items and discounts
  const autoshipSummary = useMemo(() => {
    const autoshipItems = cartItems.filter(item => item.isAutoship);
    const regularItems = cartItems.filter(item => !item.isAutoship);
    
    const autoshipSubtotal = autoshipItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const regularSubtotal = regularItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate autoship discount (25% off first order, max ₹300)
    let autoshipDiscount = 0;
    if (autoshipSubtotal > 0) {
      const discountAmount = autoshipSubtotal * (AUTOSHIP_DISCOUNTS.first.percent / 100);
      autoshipDiscount = Math.min(discountAmount, AUTOSHIP_DISCOUNTS.first.maxAmount);
    }
    
    // Calculate totals
    const subtotal = autoshipSubtotal + regularSubtotal;
    const totalAfterDiscount = subtotal - autoshipDiscount;
    
    // Determine if shipping is free (based on autoship total or overall total)
    const qualifiesForFreeShipping = totalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = qualifiesForFreeShipping ? 0 : SHIPPING_COST;
    
    // Final total
    const finalTotal = totalAfterDiscount + shippingCost;
    
    // Group autoship by frequency
    const autoshipByFrequency = {};
    autoshipItems.forEach(item => {
      const freq = item.autoshipFrequency || '4';
      if (!autoshipByFrequency[freq]) {
        autoshipByFrequency[freq] = [];
      }
      autoshipByFrequency[freq].push(item);
    });
    
    return {
      autoshipItems,
      regularItems,
      autoshipCount: autoshipItems.reduce((c, i) => c + i.quantity, 0),
      regularCount: regularItems.reduce((c, i) => c + i.quantity, 0),
      autoshipSubtotal,
      regularSubtotal,
      autoshipDiscount,
      subtotal,
      totalAfterDiscount,
      qualifiesForFreeShipping,
      shippingCost,
      finalTotal,
      autoshipByFrequency,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - totalAfterDiscount)
    };
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      // Product cart
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      
      // Concierge requests
      conciergeRequests,
      addConciergeRequest,
      removeConciergeRequest,
      clearConciergeRequests,
      submitConciergeRequests,
      getConciergeCount,
      
      // Cart UI
      isCartOpen,
      setIsCartOpen,
      
      // User tracking
      captureEmail,
      markCartConverted,
      userEmail,
      
      // Autoship
      autoshipSummary
    }}>
      {children}
    </CartContext.Provider>
  );
};
