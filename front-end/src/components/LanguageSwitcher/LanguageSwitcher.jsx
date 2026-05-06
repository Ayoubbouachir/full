import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem("app_language", lng);
    };

    return (
        <div className="language-switcher">
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="lang-select"
            >
                <option value="en">🇺🇸 EN</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="ar">🇸🇦 AR</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
