import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import { downloadBlob, formatFileSize } from '../../util/downloadBlob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserCreditsContext } from '../../context/UserCreditsContext.jsx';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, Languages, Loader2, X } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['doc', 'docx'];

// This tool only supports English <-> Vietnamese.
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
];

const POLL_INTERVAL_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The upload endpoint's response shape isn't perfectly consistent across the
// app's existing pages ({ files: [...] } vs a bare array) - handle both.
const extractUploadedFileId = (data) => {
    const candidate = Array.isArray(data) ? data[0] : data?.files?.[0] || data?.file || data;
    return candidate?.id || null;
};

const TranslatePdf = () => {
    const { token } = useAuth();
    const { credits, fetchUserCredits } = useContext(UserCreditsContext);
    const { t } = useTranslation();

    const [file, setFile] = useState(null);
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [targetLanguage, setTargetLanguage] = useState('vi');
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

    const handleTranslate = async () => {
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
                apiEndpoints.TRANSLATE_PDF,
                { fileId, sourceLanguage, targetLanguage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const finalJob = await pollJob(jobRes.data.id);
            if (!finalJob) return;

            if (finalJob.status === 'FAILED') {
                setError(finalJob.errorMessage || t('pdfTools.translateFailed'));
                setStep('failed');
            } else {
                const downloadRes = await axios.get(apiEndpoints.DOWNLOAD_FILE(finalJob.resultFileId), {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                });
                const dotIndex = file.name.lastIndexOf('.');
                const baseName = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name;
                const extension = dotIndex > 0 ? file.name.slice(dotIndex) : '.pdf';
                downloadBlob(downloadRes.data, `${baseName}-${targetLanguage}${extension}`);
                await fetchUserCredits();
                setStep('completed');
            }

            // The upload was only a means to get a fileId for the translate job -
            // it shouldn't linger as a permanent entry in My Files.
            try {
                await axios.delete(apiEndpoints.DELETE_FILE(fileId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (cleanupErr) {
                console.error('Error cleaning up temporary uploaded file:', cleanupErr);
            }
        } catch (err) {
            console.error('Error translating document:', err);
            setError(err.response?.data?.message || t('pdfTools.translateGenericError'));
            setStep('failed');
        }
    };

    const isBusy = step === 'uploading' || step === 'PENDING' || step === 'PROCESSING';
    const outOfCredits = credits <= 0;

    const statusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t('pdfTools.translatingStatus'),
    }[step];

    return (
        <PdfToolLayout title={t('pdfTools.translatePageTitle')} description={t('pdfTools.translatePageDescription')}>
            <div className="space-y-6">
                <div className="rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
                    {t('pdfTools.creditsAvailable')} <span className="font-semibold">{credits}</span>
                </div>

                {!file ? (
                    <PdfDropzone
                        onFiles={handleFiles}
                        label={t('pdfTools.translateDropzoneLabel')}
                        accept=".doc,.docx"
                        extensions={ACCEPTED_EXTENSIONS}
                    />
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    {t('pdfTools.sourceLanguage')}
                                </label>
                                <select
                                    value={sourceLanguage}
                                    onChange={(e) => setSourceLanguage(e.target.value)}
                                    disabled={isBusy}
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
                                    disabled={isBusy}
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
                        onClick={handleTranslate}
                        disabled={isBusy || outOfCredits}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isBusy ? (
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

                {step === 'completed' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
                        {t('pdfTools.translateSuccess')}
                    </div>
                )}
            </div>
        </PdfToolLayout>
    );
};

export default TranslatePdf;
