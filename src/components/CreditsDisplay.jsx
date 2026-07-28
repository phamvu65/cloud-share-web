import { CreditCard } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.jsx';

const CreditsDisplay = ({ credits }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 5 rounded-full text-blue-700">
            <CreditCard size={16} />
            <span className="font-medium">{credits}</span>
            <span className="text-xs">{t('credits.label')}</span>
        </div>
    );
};

export default CreditsDisplay;
