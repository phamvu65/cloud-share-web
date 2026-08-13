import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { apiEndpoints } from '../util/apiEndpoints.js';
import toast from 'react-hot-toast';
import {
    AlertCircle,
    ArrowLeft,
    Copy,
    Download,
    File,
    Info,
    Loader2,
    LogIn,
    Music,
    Share2,
} from 'lucide-react';
import LinkShareModal from '../components/LinkShareModal.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';
import AuthModal from '../components/AuthModal.jsx';
import JobProgressBar from '../components/tools/JobProgressBar.jsx';
import { useFilePreview } from '../hooks/useFilePreview.js';
import { usePdfJob } from '../hooks/usePdfJob.js';
import { useTranslation } from '../context/LanguageContext.jsx';
import { FROM_PDF_FORMATS, TO_PDF_FORMATS } from '../util/pdfConvertFormats.js';
import { downloadBlob } from '../util/downloadBlob.js';
import { everyPageAsRange, parsePageRanges } from '../util/pdfPageRanges.js';
import { AUTO_DETECT_CODE, TRANSLATE_LANGUAGES } from '../util/translateLanguages.js';

// No longer needs useAuth as this is a public page
const PublicFileView = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        link: '',
    });
    const { fileId } = useParams();
    const preview = useFilePreview();
    const { t } = useTranslation();

    // Run PDF Tools / File Converter jobs directly on this shared file - works
    // without an account, only downloading the finished result requires signing in.
    const job = usePdfJob();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null); // e.g. 'compress' | 'split' | 'translate' | 'from-pdf:word' | 'to-pdf:png'
    const [quality, setQuality] = useState(50);
    const [sourceLanguage, setSourceLanguage] = useState(AUTO_DETECT_CODE);
    const [targetLanguage, setTargetLanguage] = useState('vi');
    const [splitBytes, setSplitBytes] = useState(null);
    const [splitPageCount, setSplitPageCount] = useState(0);
    const [splitMode, setSplitMode] = useState('each');
    const [splitRangesInput, setSplitRangesInput] = useState('');
    const [splitLoading, setSplitLoading] = useState(false);
    const [splitProcessing, setSplitProcessing] = useState(false);
    const [splitError, setSplitError] = useState('');

    useEffect(() => {
        const getFile = async () => {
            setIsLoading(true);
            try {
                // Re-added token fetching and authorization header
                const res = await axios.get(apiEndpoints.PUBLIC_FILE_VIEW(fileId));
                setFile(res.data);
                setError(null);
                preview.open(res.data, apiEndpoints.DOWNLOAD_FILE(fileId));
            } catch (err) {
                console.error('Error fetching file:', err);
                setError(t('publicFile.errorHint'));
            } finally {
                setIsLoading(false);
            }
        };
        getFile();
        // preview.open is stable (useCallback with no deps) so it's safe to omit from deps here
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileId]);

    const handleDownload = async () => {
        try {
            // This endpoint might also require a token depending on your backend setup
            const response = await axios.get(apiEndpoints.DOWNLOAD_FILE(fileId), {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name); // Use the actual file name
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up the object URL
        } catch (err) {
            console.error('Download failed:', err);
            toast.error(t('publicFile.downloadFailed'));
        }
    };

    const openShareModal = () => {
        setShareModal({
            isOpen: true,
            link: window.location.href,
        });
    };

    const closeShareModal = () => {
        setShareModal({
            isOpen: false,
            link: '',
        });
    };

    // ---- Tool selection & execution -------------------------------------

    const SIMPLE_TOOLS = [
        { id: 'compress', title: t('pdfTools.compressTitle'), description: t('pdfTools.compressDescription') },
        { id: 'split', title: t('pdfTools.splitTitle'), description: t('pdfTools.splitDescription') },
        { id: 'translate', title: t('pdfTools.translateTitle'), description: t('pdfTools.translateDescription') },
    ];

    const FROM_PDF_TOOLS = Object.entries(FROM_PDF_FORMATS).map(([key, config]) => ({
        id: `from-pdf:${key}`,
        icon: config.icon,
        title: t('pdfTools.fromPdfTitle', { format: config.displayName }),
    }));

    const TO_PDF_TOOLS = Object.entries(TO_PDF_FORMATS).map(([key, config]) => ({
        id: `to-pdf:${key}`,
        icon: config.icon,
        title: t('pdfTools.toPdfTitle', { format: config.displayName }),
    }));

    const toolCategory = selectedTool?.startsWith('from-pdf:')
        ? 'from-pdf'
        : selectedTool?.startsWith('to-pdf:')
          ? 'to-pdf'
          : selectedTool;

    const isJobBusy = job.isBusy;
    const isPanelBusy = isJobBusy || splitProcessing || splitLoading;

    const resetToolPanel = () => {
        if (isPanelBusy) return;
        setSelectedTool(null);
        job.reset();
        setSplitBytes(null);
        setSplitPageCount(0);
        setSplitMode('each');
        setSplitRangesInput('');
        setSplitError('');
    };

    const selectTool = async (toolId) => {
        setSelectedTool(toolId);
        job.reset();
        setSplitError('');

        if (toolId === 'split') {
            setSplitLoading(true);
            try {
                const res = await axios.get(apiEndpoints.DOWNLOAD_FILE(fileId), { responseType: 'arraybuffer' });
                const doc = await PDFDocument.load(res.data, { ignoreEncryption: true });
                setSplitBytes(res.data);
                setSplitPageCount(doc.getPageCount());
            } catch (err) {
                console.error('Error reading PDF:', err);
                setSplitError(t('pdfTools.readError'));
            } finally {
                setSplitLoading(false);
            }
        }
    };

    const runCompress = () =>
        job.run({
            sourceFile: { id: fileId, name: file.name },
            jobEndpoint: apiEndpoints.COMPRESS_PDF,
            buildPayload: (fid) => ({ fileId: fid, quality }),
            buildDownloadName: (name) => `${name.replace(/\.pdf$/i, '')}-compressed.pdf`,
            failedMessage: t('pdfTools.compressFailed'),
            genericErrorMessage: t('pdfTools.compressGenericError'),
        });

    const runTranslate = () =>
        job.run({
            sourceFile: { id: fileId, name: file.name },
            jobEndpoint: apiEndpoints.TRANSLATE_PDF,
            buildPayload: (fid) => ({ fileId: fid, sourceLanguage, targetLanguage }),
            buildDownloadName: (name) => {
                const dotIndex = name.lastIndexOf('.');
                const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
                const extension = dotIndex > 0 ? name.slice(dotIndex) : '.pdf';
                return `${baseName}-${targetLanguage}${extension}`;
            },
            failedMessage: t('pdfTools.translateFailed'),
            genericErrorMessage: t('pdfTools.translateGenericError'),
        });

    const runConvert = () => {
        const [direction, formatKey] = selectedTool.split(':');
        if (direction === 'from-pdf') {
            const config = FROM_PDF_FORMATS[formatKey];
            return job.run({
                sourceFile: { id: fileId, name: file.name },
                jobEndpoint: apiEndpoints.CONVERT_FROM_PDF,
                buildPayload: (fid) => ({ fileId: fid, targetFormat: config.convertFormat }),
                buildDownloadName: (name) => name.replace(/\.pdf$/i, '') + config.extension,
                failedMessage: t('pdfTools.convertFailed'),
                genericErrorMessage: t('pdfTools.convertGenericError'),
            });
        }
        return job.run({
            sourceFile: { id: fileId, name: file.name },
            jobEndpoint: apiEndpoints.CONVERT_TO_PDF,
            buildPayload: (fid) => ({ fileId: fid }),
            buildDownloadName: (name) => {
                const dotIndex = name.lastIndexOf('.');
                const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
                return `${baseName}.pdf`;
            },
            failedMessage: t('pdfTools.convertFailed'),
            genericErrorMessage: t('pdfTools.convertGenericError'),
        });
    };

    const handleRunTool = () => {
        if (toolCategory === 'compress') runCompress();
        else if (toolCategory === 'translate') runTranslate();
        else runConvert();
    };

    const handleSplit = async () => {
        if (!splitBytes) return;

        let ranges;
        try {
            ranges = splitMode === 'each' ? everyPageAsRange(splitPageCount) : parsePageRanges(splitRangesInput, splitPageCount);
        } catch (err) {
            setSplitError(err.message);
            return;
        }

        setSplitProcessing(true);
        setSplitError('');
        try {
            const src = await PDFDocument.load(splitBytes, { ignoreEncryption: true });
            const baseName = file.name.replace(/\.pdf$/i, '');

            const outputs = [];
            for (const range of ranges) {
                const doc = await PDFDocument.create();
                const indices = [];
                for (let p = range.start; p <= range.end; p++) indices.push(p - 1);
                const pages = await doc.copyPages(src, indices);
                pages.forEach((page) => doc.addPage(page));
                outputs.push({ name: `${baseName}-p${range.label}.pdf`, bytes: await doc.save() });
            }

            if (outputs.length === 1) {
                downloadBlob(new Blob([outputs[0].bytes], { type: 'application/pdf' }), outputs[0].name);
            } else {
                const zip = new JSZip();
                outputs.forEach((o) => zip.file(o.name, o.bytes));
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(zipBlob, `${baseName}-split.zip`);
            }
        } catch (err) {
            console.error('Error splitting PDF:', err);
            setSplitError(t('pdfTools.splitError'));
        } finally {
            setSplitProcessing(false);
        }
    };

    const QUALITY_PRESETS = [
        { label: t('pdfTools.compressStrong'), hint: t('pdfTools.compressStrongHint'), value: 20 },
        { label: t('pdfTools.compressBalanced'), hint: t('pdfTools.compressBalancedHint'), value: 50 },
        { label: t('pdfTools.compressHigh'), hint: t('pdfTools.compressHighHint'), value: 80 },
    ];

    const processingStatusKey =
        toolCategory === 'compress'
            ? 'pdfTools.processingStatus'
            : toolCategory === 'translate'
              ? 'pdfTools.translatingStatus'
              : 'pdfTools.convertingStatus';
    const jobStatusLabel = { PENDING: t('pdfTools.queuedStatus'), PROCESSING: t(processingStatusKey) }[job.step];
    const runButtonLabelKey =
        toolCategory === 'compress' ? 'pdfTools.compressButton' : toolCategory === 'translate' ? 'pdfTools.translateButton' : 'pdfTools.convertButton';
    const successMessageKey =
        toolCategory === 'compress' ? 'pdfTools.compressSuccess' : toolCategory === 'translate' ? 'pdfTools.translateSuccess' : 'pdfTools.convertSuccess';
    const genericErrorKey =
        toolCategory === 'compress'
            ? 'pdfTools.compressGenericError'
            : toolCategory === 'translate'
              ? 'pdfTools.translateGenericError'
              : 'pdfTools.convertGenericError';

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-gray-600">{t('publicFile.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-red-600">{t('publicFile.error')}</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (!file) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="p-4 border-b bg-white">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Share2 className="text-blue-600" />
                        <span className="font-bold text-xl text-gray-800">{t('publicFile.brand')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageToggle />
                        <button
                            onClick={openShareModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Copy size={18} />
                            {t('publicFile.shareLink')}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 md:p-8 flex justify-center">
                <div className={`w-full ${preview.url ? 'max-w-4xl' : 'max-w-3xl'}`}>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
                        <div className="flex justify-center mb-4">
                            {preview.kind === 'image' && preview.url ? (
                                <img src={preview.url} alt={file.name} className="max-h-[85vh] w-full rounded-lg object-contain" />
                            ) : preview.kind === 'pdf' && preview.url ? (
                                <iframe src={preview.url} title={file.name} className="h-[85vh] w-full rounded-lg border-0" />
                            ) : preview.kind === 'video' && preview.url ? (
                                <video src={preview.url} controls className="max-h-[85vh] w-full rounded-lg" />
                            ) : preview.kind === 'audio' && preview.url ? (
                                <div className="flex w-full flex-col items-center gap-6 py-8">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <Music size={32} />
                                    </div>
                                    <audio src={preview.url} controls className="w-full max-w-md" />
                                </div>
                            ) : preview.loading ? (
                                <div className="flex h-20 w-20 items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-blue-400" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                    <File size={40} className="text-blue-500" />
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-800 break-words">{file.name}</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            {(file.size / 1024).toFixed(2)} KB
                            <span className="mx-2">&bull;</span>
                            {t('publicFile.sharedOn')} {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>

                        <div className="my-6">
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full uppercase">
                                {file.type || 'File'}
                            </span>
                        </div>

                        <div className="flex justify-center gap-4 my-8">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow"
                            >
                                <Download size={18} />
                                {t('publicFile.downloadFile')}
                            </button>
                        </div>

                        <hr className="my-8" />

                        <div>
                            <h3 className="text-lg font-semibold text-left text-gray-800 mb-4">{t('publicFile.fileInfoTitle')}</h3>
                            <div className="text-left text-sm space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('publicFile.fileName')}</span>
                                    <span className="text-gray-800 font-medium break-all">{file.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('publicFile.fileType')}</span>
                                    <span className="text-gray-800 font-medium">{file.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('publicFile.fileSize')}</span>
                                    <span className="text-gray-800 font-medium">{(file.size / 1024).toFixed(2)} KB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('publicFile.shared')}</span>
                                    <span className="text-gray-800 font-medium">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDF Tools / File Converter - usable without an account, sign-in only gates downloading the result */}
                    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-left">
                        <h3 className="text-lg font-semibold text-gray-800">{t('publicFile.toolsTitle')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('publicFile.toolsSubtitle')}</p>

                        {!selectedTool ? (
                            <div className="mt-5 space-y-6">
                                <div>
                                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                        {t('pdfTools.hubTitle')}
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {SIMPLE_TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => selectTool(tool.id)}
                                                className="rounded-lg border border-gray-200 p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                            >
                                                <span className="block font-semibold text-gray-900">{tool.title}</span>
                                                <span className="mt-1 block text-xs text-gray-500">{tool.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                        {t('pdfTools.toPdfSection')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {TO_PDF_TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => selectTool(tool.id)}
                                                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                            >
                                                <tool.icon size={18} className="shrink-0 text-purple-600" />
                                                <span className="truncate font-medium text-gray-800">{tool.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                        {t('pdfTools.fromPdfSection')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {FROM_PDF_TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => selectTool(tool.id)}
                                                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                            >
                                                <tool.icon size={18} className="shrink-0 text-purple-600" />
                                                <span className="truncate font-medium text-gray-800">{tool.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-5">
                                <button
                                    onClick={resetToolPanel}
                                    disabled={isPanelBusy}
                                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 disabled:opacity-50"
                                >
                                    <ArrowLeft size={16} /> {t('publicFile.backToToolList')}
                                </button>

                                {selectedTool === 'split' ? (
                                    <div className="space-y-5">
                                        {splitLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Loader2 size={18} className="animate-spin" /> {t('common.loading')}
                                            </div>
                                        ) : splitBytes ? (
                                            <>
                                                <div className="rounded-lg border border-gray-200 p-5">
                                                    <p className="mb-3 text-sm text-gray-600">
                                                        {file.name} • {splitPageCount} {t('pdfTools.pages')}
                                                    </p>
                                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                                                        <button
                                                            onClick={() => setSplitMode('each')}
                                                            className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${
                                                                splitMode === 'each'
                                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {t('pdfTools.splitEachPage')}
                                                        </button>
                                                        <button
                                                            onClick={() => setSplitMode('custom')}
                                                            className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${
                                                                splitMode === 'custom'
                                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {t('pdfTools.splitCustomRange')}
                                                        </button>
                                                    </div>

                                                    {splitMode === 'custom' && (
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                {t('pdfTools.splitRangeLabel', { count: splitPageCount || 'N' })}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={splitRangesInput}
                                                                onChange={(e) => setSplitRangesInput(e.target.value)}
                                                                placeholder={`vd: 1-3, 5, 8-${splitPageCount}`}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {splitError && (
                                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                                                        <AlertCircle size={18} />
                                                        {splitError}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={handleSplit}
                                                    disabled={splitProcessing}
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    {splitProcessing ? (
                                                        <>
                                                            <Loader2 size={18} className="animate-spin" /> {t('pdfTools.splitting')}
                                                        </>
                                                    ) : (
                                                        t('pdfTools.splitButton')
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            splitError && (
                                                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                                                    <AlertCircle size={18} />
                                                    {splitError}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {toolCategory === 'compress' && (
                                            <div className="rounded-lg border border-gray-200 p-5">
                                                <p className="mb-3 text-sm font-medium text-gray-700">{t('pdfTools.compressionLevel')}</p>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    {QUALITY_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.value}
                                                            onClick={() => setQuality(preset.value)}
                                                            disabled={isJobBusy}
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

                                        {toolCategory === 'translate' && (
                                            <div className="rounded-lg border border-gray-200 p-5">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                            {t('pdfTools.sourceLanguage')}
                                                        </label>
                                                        <select
                                                            value={sourceLanguage}
                                                            onChange={(e) => setSourceLanguage(e.target.value)}
                                                            disabled={isJobBusy}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
                                                        >
                                                            <option value={AUTO_DETECT_CODE}>{t('pdfTools.autoDetect')}</option>
                                                            {TRANSLATE_LANGUAGES.map((lang) => (
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
                                                            disabled={isJobBusy}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
                                                        >
                                                            {TRANSLATE_LANGUAGES.map((lang) => (
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

                                        {isJobBusy ? (
                                            <JobProgressBar label={jobStatusLabel} progress={job.progress} />
                                        ) : (
                                            job.step !== 'awaiting-login' &&
                                            job.step !== 'completed' && (
                                                <button
                                                    onClick={handleRunTool}
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    {t(runButtonLabelKey)}
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
                                                {t(successMessageKey)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center gap-4">
                        <Info size={20} />
                        <p className="text-sm">{t('publicFile.publicNote')}</p>
                    </div>
                </div>
            </main>
            <LinkShareModal
                isOpen={shareModal.isOpen}
                onClose={closeShareModal}
                link={shareModal.link}
                title={t('myFiles.shareModalTitle')}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode="signin"
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={() => job.completeDownload(t(genericErrorKey))}
            />
        </div>
    );
};

export default PublicFileView;
