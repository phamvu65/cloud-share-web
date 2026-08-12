import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import AuthModal from '../../components/AuthModal.jsx';
import { usePdfJob } from '../../hooks/usePdfJob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { formatFileSize } from '../../util/downloadBlob.js';
import { FROM_PDF_FORMATS } from '../../util/pdfConvertFormats.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, LogIn, Loader2, X } from 'lucide-react';

const ConvertFromPdf = () => {
    const { format } = useParams();
    const config = FROM_PDF_FORMATS[format];
    const { t } = useTranslation();
    const job = usePdfJob();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    if (!config) return <Navigate to="/pdf-tools" replace />;

    const handleConvert = () =>
        job.run({
            jobEndpoint: apiEndpoints.CONVERT_FROM_PDF,
            buildPayload: (fileId) => ({ fileId, targetFormat: config.convertFormat }),
            buildDownloadName: (name) => name.replace(/\.pdf$/i, '') + config.extension,
            failedMessage: t('pdfTools.convertFailed'),
            genericErrorMessage: t('pdfTools.convertGenericError'),
        });

    const statusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t('pdfTools.convertingStatus'),
    }[job.step];

    return (
        <PdfToolLayout
            title={t('pdfTools.fromPdfTitle', { format: config.displayName })}
            description={t('pdfTools.fromPdfPageDescription', { format: config.displayName })}
            backTo="/file-converter"
            activeMenu="fileConverter"
            backLabel={t('pdfTools.backToConverter')}
        >
            <div className="space-y-6">
                {!job.file ? (
                    <PdfDropzone onFiles={job.handleFiles} label={t('pdfTools.dropzoneLabelSingle')} accept=".pdf" extensions={['pdf']} />
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

                {job.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {job.error}
                    </div>
                )}

                {job.file && job.step !== 'awaiting-login' && (
                    <button
                        onClick={handleConvert}
                        disabled={job.isBusy}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {job.isBusy ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> {statusLabel}
                            </>
                        ) : (
                            t('pdfTools.convertButton')
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
                        {t('pdfTools.convertSuccess')}
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode="signin"
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={() => job.completeDownload(t('pdfTools.convertGenericError'))}
            />
        </PdfToolLayout>
    );
};

export default ConvertFromPdf;
