import { useTranslation } from '../context/LanguageContext.jsx';

const LanguageToggle = ({ className = '' }) => {
    const { language, toggleLanguage } = useTranslation();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            className={`rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 ${className}`}
        >
            {language === 'vi' ? 'VI' : 'EN'}
        </button>
    );
};

export default LanguageToggle;
