import { useTranslation } from '../../context/LanguageContext.jsx';

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="bg-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-base text-gray-400">{t('landing.footerCopyright')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
