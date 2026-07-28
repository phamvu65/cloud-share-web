import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import { downloadBlob, formatFileSize } from '../../util/downloadBlob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserCreditsContext } from '../../context/UserCreditsContext.jsx';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, Loader2, X } from 'lucide-react';

const POLL_INTERVAL_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The upload endpoint's response shape isn't perfectly consistent across the
// app's existing pages ({ files: [...] } vs a bare array) - handle both.
const extractUploadedFileId = (data) => {
    const candidate = Array.isArray(data) ? data[0] : data?.files?.[0] || data?.file || data;
    return candidate?.id || null;
};

const CompressPdf = () => {
    const { token } = useAuth();
    const { credits, fetchUserCredits } = useContext(UserCreditsContext);
    const { t } = useTranslation();

    const QUALITY_PRESETS = [
        { label: t('pdfTools.compressStrong'), hint: t('pdfTools.compressStrongHint'), value: 20 },
        { label: t('pdfTools.compressBalanced'), hint: t('pdfTools.compressBalancedHint'), value: 50 },
        { label: t('pdfTools.compressHigh'), hint: t('pdfTools.compressHighHint'), value: 80 },
    ];

    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState(50);
    const [step, setStep] = useState('idle'); // idle | uploading | PENDING | PROCESSING | completed | failed
    const [error, setError] = useState('');
    const isCancelledRef = useRef(false);

    useEffect(() => {
        isCancelledRef.current = false;
        return () => {
            isCancelledRef.current = true;
        };
    }, []);

    const handleFiles = (files) => {
        setFile(files[0]);
        setStep('idle');
        setError('');
    };

    const handleReset = () => {
        setFile(null);
        setStep('idle');
        setError('');
    };

    const pollJob = async (jobId) => {
        while (!isCancelledRef.current) {
            const res = await axios.get(apiEndpoints.GET_PDF_JOB(jobId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const job = res.data;

            if (isCancelledRef.current) return null;
            setStep(job.status);

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
                return job;
            }
            await sleep(POLL_INTERVAL_MS);
        }
        return null;
    };

    const handleCompress = async () => {
        if (!file) return;
        setError('');

        try {
            setStep('uploading');
            const formData = new FormData();
            formData.append('files', file);
            const uploadRes = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchUserCredits();

            const fileId = extractUploadedFileId(uploadRes.data);
            if (!fileId) {
                throw new Error('missing-file-id');
            }

            setStep('PENDING');
            const jobRes = await axios.post(
                apiEndpoints.COMPRESS_PDF,
                { fileId, quality },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            const finalJob = await pollJob(jobRes.data.id);
            if (!finalJob) return;

            if (finalJob.status === 'FAILED') {
                setError(finalJob.errorMessage || t('pdfTools.compressFailed'));
                setStep('failed');
            } else {
                const downloadRes = await axios.get(apiEndpoints.DOWNLOAD_FILE(finalJob.resultFileId), {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                });
                const baseName = file.name.replace(/\.pdf$/i, '');
                downloadBlob(downloadRes.data, `${baseName}-compressed.pdf`);
                await fetchUserCredits();
                setStep('completed');
            }

            // The upload was only a means to get a fileId for the compress job -
            // it shouldn't linger as a permanent entry in My Files.
            try {
                await axios.delete(apiEndpoints.DELETE_FILE(fileId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (cleanupErr) {
                console.error('Error cleaning up temporary uploaded file:', cleanupErr);
            }
        } catch (err) {
            console.error('Error compressing PDF:', err);
            setError(err.response?.data?.message || t('pdfTools.compressGenericError'));
            setStep('failed');
        }
    };

    const isBusy = step === 'uploading' || step === 'PENDING' || step === 'PROCESSING';
    const outOfCredits = credits <= 0;

    const statusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t('pdfTools.processingStatus'),
    }[step];

    return (
        <PdfToolLayout title={t('pdfTools.compressPageTitle')} description={t('pdfTools.compressPageDescription')}>
            <div className="space-y-6">
                <div className="rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
                    {t('pdfTools.creditsAvailable')} <span className="font-semibold">{credits}</span>
                </div>

                {!file ? (
                    <PdfDropzone onFiles={handleFiles} label={t('pdfTools.dropzoneLabelSingle')} />
                ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-blue-600" size={22} />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        {!isBusy && (
                            <button onClick={handleReset} title={t('pdfTools.remove')} className="text-gray-400 hover:text-red-500">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {file && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <p className="mb-3 text-sm font-medium text-gray-700">{t('pdfTools.compressionLevel')}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {QUALITY_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setQuality(preset.value)}
                                    disabled={isBusy}
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

                {outOfCredits && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                        <AlertCircle size={18} />
                        {t('pdfTools.outOfCredits')}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {file && (
                    <button
                        onClick={handleCompress}
                        disabled={isBusy || outOfCredits}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isBusy ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> {statusLabel}
                            </>
                        ) : (
                            t('pdfTools.compressButton')
                        )}
                    </button>
                )}

                {step === 'completed' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
                        {t('pdfTools.compressSuccess')}
                    </div>
                )}
            </div>
        </PdfToolLayout>
    );
};

export default CompressPdf;
