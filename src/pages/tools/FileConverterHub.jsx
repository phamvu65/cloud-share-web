import DashboardLayout from '../../layout/DashboardLayout.jsx';
import { ToolCard, ToolSection } from '../../components/tools/HubCards.jsx';
import { FROM_PDF_FORMATS, TO_PDF_FORMATS } from '../../util/pdfConvertFormats.js';
import { useTranslation } from '../../context/LanguageContext.jsx';

const FileConverterHub = () => {
    const { t } = useTranslation();

    const FROM_PDF_TOOLS = Object.entries(FROM_PDF_FORMATS).map(([key, config]) => ({
        to: `/file-converter/from-pdf/${key}`,
        icon: config.icon,
        title: t('pdfTools.fromPdfTitle', { format: config.displayName }),
        description: t('pdfTools.fromPdfDescription', { format: config.displayName }),
    }));

    const TO_PDF_TOOLS = Object.entries(TO_PDF_FORMATS).map(([key, config]) => ({
        to: `/file-converter/to-pdf/${key}`,
        icon: config.icon,
        title: t('pdfTools.toPdfTitle', { format: config.displayName }),
        description: t('pdfTools.toPdfDescription', { format: config.displayName }),
    }));

    return (
        <DashboardLayout activeMenu="fileConverter">
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{t('pdfTools.converterHubTitle')}</h1>
                    <p className="text-gray-600">{t('pdfTools.converterHubSubtitle')}</p>
                </div>

                <ToolSection title={t('pdfTools.fromPdfSection')}>
                    {FROM_PDF_TOOLS.map((tool) => (
                        <ToolCard key={tool.to} tool={tool} />
                    ))}
                </ToolSection>

                <ToolSection title={t('pdfTools.toPdfSection')}>
                    {TO_PDF_TOOLS.map((tool) => (
                        <ToolCard key={tool.to} tool={tool} />
                    ))}
                </ToolSection>
            </div>
        </DashboardLayout>
    );
};

export default FileConverterHub;
