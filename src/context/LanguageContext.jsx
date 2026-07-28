import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext(null);

const getInitialLanguage = () => {
    const stored = localStorage.getItem('language');
    return stored === 'en' ? 'en' : 'vi';
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(getInitialLanguage);

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));

    const t = useMemo(() => {
        const dict = translations[language] || translations.vi;
        return (key, vars) => {
            const raw = key.split('.').reduce((acc, part) => acc?.[part], dict) ?? key;
            if (!vars) return raw;
            return Object.entries(vars).reduce(
                (str, [name, value]) => str.replaceAll(`{${name}}`, value),
                raw
            );
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
