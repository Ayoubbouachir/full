import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const currencies = {
    USD: { symbol: '$', rate: 1, label: 'USD / $' },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR / €' },
    TND: { symbol: 'DT', rate: 3.10, label: 'TND / DT' },
    SAR: { symbol: 'SR', rate: 3.75, label: 'SAR / SR' }
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('app_currency');
        return saved && currencies[saved] ? saved : 'USD';
    });

    useEffect(() => {
        localStorage.setItem('app_currency', currency);
    }, [currency]);

    const formatPrice = (amountInUSD) => {
        const { symbol, rate } = currencies[currency];
        const converted = (amountInUSD * rate).toFixed(2);

        // Position symbol based on currency/language preference (simplified)
        if (currency === 'TND' || currency === 'SAR') {
            return `${converted} ${symbol}`;
        }
        return `${symbol}${converted}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, currencies }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
