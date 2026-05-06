import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import './CurrencySwitcher.css';

const CurrencySwitcher = () => {
    const { currency, setCurrency, currencies } = useCurrency();

    return (
        <div className="currency-switcher">
            <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="currency-select"
            >
                {Object.keys(currencies).map((code) => (
                    <option key={code} value={code}>
                        {currencies[code].label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CurrencySwitcher;
