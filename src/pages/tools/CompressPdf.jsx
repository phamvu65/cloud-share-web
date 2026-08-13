import { useState } from 'react';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import AuthModal from '../../components/AuthModal.jsx';
import JobProgressBar from '../../components/tools/JobProgressBar.jsx';
import { usePdfJob } from '../../hooks/usePdfJob.js';
import { formatFileSize } from '../../util/downloadBlob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, LogIn, X } from 'lucide-react';

const CompressPdf = () => {
    const { t } = useTranslation();
    const job = usePdfJob();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [quality, setQuality] = useState(50);

    const QUALITY_PRESETS = [
        { label: t('pdfTools.compressStrong'), hint: t('pdfTools.compressStrongHint'), value: 20 },
        { label: t('pdfTools.compressBalanced'), hint: t('pdfTools.compressBalancedHint'), value: 50 },
        { label: t('pdfTools.compressHigh'), hint: t('pdfTools.compressHighHint'), value: 80 },
    ];

    const handleCompress = () =>
        job.run({
            jobEndpoint: apiEndpoints.COMPRESS_PDF,
            buildPayload: (fileId) => ({ fileId, quality }),
            buildDownloadName: (name) => `${name.replace(/\.pdf$/i, '')}-compressed.pdf`,
            failedMessage: t('pdfTools.compressFailed'),
            genericErrorMessage: t('pdfTools.compressGenericError'),
        });

    const statusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t('pdfTools.processingStatus'),
    }[job.step];

    return (
        <PdfToolLayout title={t('pdfTools.compressPageTitle')} description={t('pdfTools.compressPageDescription')}>
            <div className="space-y-6">
                {!job.file ? (
                    <PdfDropzone onFiles={job.handleFiles} label={t('pdfTools.dropzoneLabelSingle')} />
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
                        <p className="mb-3 text-sm font-medium text-gray-700">{t('pdfTools.compressionLevel')}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {QUALITY_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setQuality(preset.value)}
                                    disabled={job.isBusy}
                                    className={`rounded-lg border px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
                                        quality === preset.value
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="block font-semibold">{preset.label}</span>
                                    <span className="text-xs opacity-80">{preset.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {job.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {job.error}
                    </div>
                )}

                {job.isBusy ? (
                    <JobProgressBar label={statusLabel} progress={job.progress} />
                ) : (
                    job.file &&
                    job.step !== 'awaiting-login' && (
                        <button
                            onClick={handleCompress}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                        >
                            {t('pdfTools.compressButton')}
                        </button>
                    )
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
                        {t('pdfTools.compressSuccess')}
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode="signin"
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={() => job.completeDownload(t('pdfTools.compressGenericError'))}
            />
        </PdfToolLayout>
    );
};

export default CompressPdf;
