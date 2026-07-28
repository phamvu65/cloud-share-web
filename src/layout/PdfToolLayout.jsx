import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';

const PdfToolLayout = ({ title, description, children }) => {
    const { t } = useTranslation();
    return (
        <DashboardLayout activeMenu="pdfTools">
            <div className="p-6">
                <Link to="/pdf-tools" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600">
                    <ArrowLeft size={16} /> {t('pdfTools.backToTools')}
                </Link>

                <div className="mx-auto max-w-3xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        {description && <p className="mt-1 text-gray-600">{description}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PdfToolLayout;
