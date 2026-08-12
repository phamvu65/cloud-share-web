import DashboardLayout from '../../layout/DashboardLayout.jsx';
import { ToolCard } from '../../components/tools/HubCards.jsx';
import { Combine, FileEdit, Languages, Scissors, Shrink } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.jsx';

const PdfToolsHub = () => {
    const { t } = useTranslation();

    const TOOLS = [
        { to: '/pdf-tools/merge', icon: Combine, title: t('pdfTools.mergeTitle'), description: t('pdfTools.mergeDescription') },
        { to: '/pdf-tools/split', icon: Scissors, title: t('pdfTools.splitTitle'), description: t('pdfTools.splitDescription') },
        { to: '/pdf-tools/compress', icon: Shrink, title: t('pdfTools.compressTitle'), description: t('pdfTools.compressDescription') },
        { to: '/pdf-tools/translate', icon: Languages, title: t('pdfTools.translateTitle'), description: t('pdfTools.translateDescription') },
    ];

    const COMING_SOON = [{ icon: FileEdit, title: t('pdfTools.editTitle'), description: t('pdfTools.editDescription') }];

    return (
        <DashboardLayout activeMenu="pdfTools">
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{t('pdfTools.hubTitle')}</h1>
                    <p className="text-gray-600">{t('pdfTools.hubSubtitle')}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {TOOLS.map((tool) => (
                        <ToolCard key={tool.to} tool={tool} />
                    ))}

                    {COMING_SOON.map((tool) => (
                        <div key={tool.title} className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 opacity-70">
                            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                                <tool.icon size={22} />
                            </div>
                            <h3 className="font-semibold text-gray-700">{tool.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                            <span className="mt-3 inline-block rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                {t('pdfTools.comingSoon')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PdfToolsHub;
