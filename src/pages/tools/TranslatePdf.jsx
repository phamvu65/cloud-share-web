import { useState } from 'react';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import AuthModal from '../../components/AuthModal.jsx';
import { usePdfJob } from '../../hooks/usePdfJob.js';
import { formatFileSize } from '../../util/downloadBlob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, Languages, LogIn, Loader2, X } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['doc', 'docx'];

// This tool only supports English <-> Vietnamese.
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
];

const TranslatePdf = () => {
    const { t } = useTranslation();
    const job = usePdfJob();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [targetLanguage, setTargetLanguage] = useState('vi');

    const handleTranslate = () =>
        job.run({
            jobEndpoint: apiEndpoints.TRANSLATE_PDF,
            buildPayload: (fileId) => ({ fileId, sourceLanguage, targetLanguage }),
            buildDownloadName: (name) => {
                const dotIndex = name.lastIndexOf('.');
                const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
                const extension = dotIndex > 0 ? name.slice(dotIndex) : '.pdf';
                return `${baseName}-${targetLanguage}${extension}`;
            },
            failedMessage: t('pdfTools.translateFailed'),
            genericErrorMessage: t('pdfTools.translateGenericError'),
        });

    const statusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t('pdfTools.translatingStatus'),
    }[job.step];

    return (
        <PdfToolLayout title={t('pdfTools.translatePageTitle')} description={t('pdfTools.translatePageDescription')}>
            <div className="space-y-6">
                {!job.file ? (
                    <PdfDropzone
                        onFiles={job.handleFiles}
                        label={t('pdfTools.translateDropzoneLabel')}
                        accept=".doc,.docx"
                        extensions={ACCEPTED_EXTENSIONS}
                    />
                ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-blue-600" size={22} />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{job.file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(job.file.size)}</p>
                            </div>
                        </div>
                        {!job.isBusy && (
                            <button onClick={job.reset} title={t('pdfTools.remove')} className="text-gray-400 hover:text-red-500">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {job.file && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    {t('pdfTools.sourceLanguage')}
                                </label>
                                <select
                                    value={sourceLanguage}
                                    onChange={(e) => setSourceLanguage(e.target.value)}
                                    disabled={job.isBusy}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    {t('pdfTools.targetLanguage')}
                                </label>
                                <select
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    disabled={job.isBusy}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {job.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {job.error}
                    </div>
                )}

                {job.file && job.step !== 'awaiting-login' && (
                    <button
                        onClick={handleTranslate}
                        disabled={job.isBusy}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {job.isBusy ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> {statusLabel}
                            </>
                        ) : (
                            <>
                                <Languages size={18} />
                                {t('pdfTools.translateButton')}
                            </>
                        )}
                    </button>
                )}

                {job.step === 'awaiting-login' && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                        <p className="mb-3 text-sm text-purple-800">{t('pdfTools.loginToDownloadHint')}</p>
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                        >
                            <LogIn size={16} />
                            {t('pdfTools.loginToDownload')}
                        </button>
                    </div>
                )}

                {job.step === 'completed' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
                        {t('pdfTools.translateSuccess')}
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode="signin"
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={() => job.completeDownload(t('pdfTools.translateGenericError'))}
            />
        </PdfToolLayout>
    );
};

export default TranslatePdf;
