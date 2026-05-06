import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

const getCartKey = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            return `cart_${user.email || user.userEmail}`;
        } catch (e) {
            return 'cart_guest';
        }
    }
    return 'cart_guest';
};

export const CartProvider = ({ children }) => {
    // Initialize cartItems directly from localStorage to avoid race condition
    const [cartKey, setCartKey] = useState(getCartKey());
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem(getCartKey());
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            return [];
        }
    });
    const [isLoaded, setIsLoaded] = useState(true);

    // Effect to update cartKey when localStorage user changes
    useEffect(() => {
        const handleStorageChange = () => {
            const newKey = getCartKey();
            if (newKey !== cartKey) {
                setCartKey(newKey);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        // Also check periodically or on mount
        const interval = setInterval(handleStorageChange, 1000); 
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [cartKey]);

    // Load cart when cartKey changes (user login/logout)
    useEffect(() => {
        const savedCart = localStorage.getItem(cartKey);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
        setIsLoaded(true);
    }, [cartKey]);

    // Save cart to localStorage whenever it changes (only after initial load)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        }
    }, [cartItems, cartKey, isLoaded]);

    const addToCart = useCallback((product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item._id === product._id);

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(item =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [...prevItems, { ...product, quantity }];
            }
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === productId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const getCartTotal = useCallback(() => {
        return cartItems.reduce((total, item) => total + (item.prix * item.quantity), 0);
    }, [cartItems]);

    const getCartCount = useCallback(() => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }, [cartItems]);

    const value = useMemo(() => ({
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
