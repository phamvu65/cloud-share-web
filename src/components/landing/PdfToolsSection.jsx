import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { AlertCircle, ArrowLeft, FileText, LogIn, Loader2, Languages, Scissors, Shrink, X } from 'lucide-react';
import PdfDropzone from '../tools/PdfDropzone.jsx';
import AuthModal from '../AuthModal.jsx';
import { usePdfJob } from '../../hooks/usePdfJob.js';
import { apiEndpoints } from '../../util/apiEndpoints.js';
import { downloadBlob, formatFileSize } from '../../util/downloadBlob.js';
import { everyPageAsRange, parsePageRanges } from '../../util/pdfPageRanges.js';
import { FROM_PDF_FORMATS, TO_PDF_FORMATS } from '../../util/pdfConvertFormats.js';
import { useTranslation } from '../../context/LanguageContext.jsx';

// This tool only supports English <-> Vietnamese.
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
];

// Lets a visitor run any PDF Tools / File Converter job right on the landing page,
// without an account - only downloading the finished result requires signing in.
const PdfToolsSection = () => {
    const { t } = useTranslation();
    const job = usePdfJob();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null); // 'compress' | 'split' | 'translate' | 'from-pdf:<format>' | 'to-pdf:<format>'
    const [quality, setQuality] = useState(50);
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [targetLanguage, setTargetLanguage] = useState('vi');
    const [splitPageCount, setSplitPageCount] = useState(0);
    const [splitMode, setSplitMode] = useState('each');
    const [splitRangesInput, setSplitRangesInput] = useState('');
    const [splitProcessing, setSplitProcessing] = useState(false);
    const [splitReading, setSplitReading] = useState(false);
    const [splitError, setSplitError] = useState('');

    const SIMPLE_TOOLS = [
        { id: 'compress', icon: Shrink, title: t('pdfTools.compressTitle'), description: t('pdfTools.compressDescription') },
        { id: 'split', icon: Scissors, title: t('pdfTools.splitTitle'), description: t('pdfTools.splitDescription') },
        { id: 'translate', icon: Languages, title: t('pdfTools.translateTitle'), description: t('pdfTools.translateDescription') },
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
    const isPanelBusy = job.isBusy || splitProcessing || splitReading;

    const dropzoneConfig = (() => {
        if (toolCategory === 'translate') {
            return { accept: '.doc,.docx', extensions: ['doc', 'docx'], label: t('pdfTools.translateDropzoneLabel') };
        }
        if (toolCategory === 'to-pdf') {
            const config = TO_PDF_FORMATS[selectedTool.split(':')[1]];
            return { accept: config.accept, extensions: config.extensions, label: t('pdfTools.dropzoneLabelFormat', { format: config.displayName }) };
        }
        return { accept: '.pdf', extensions: ['pdf'], label: t('pdfTools.dropzoneLabelSingle') };
    })();

    const resetPanel = () => {
        if (isPanelBusy) return;
        setSelectedTool(null);
        job.reset();
        setSplitPageCount(0);
        setSplitMode('each');
        setSplitRangesInput('');
        setSplitError('');
    };

    const selectTool = (toolId) => {
        setSelectedTool(toolId);
        job.reset();
        setSplitPageCount(0);
        setSplitError('');
    };

    const removeFile = () => {
        job.reset();
        setSplitPageCount(0);
        setSplitError('');
    };

    const handleFiles = async (files) => {
        job.handleFiles(files);
        if (selectedTool === 'split') {
            setSplitError('');
            setSplitReading(true);
            try {
                const bytes = await files[0].arrayBuffer();
                const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
                setSplitPageCount(doc.getPageCount());
            } catch (err) {
                console.error('Error reading PDF:', err);
                setSplitError(t('pdfTools.readError'));
            } finally {
                setSplitReading(false);
            }
        }
    };

    const runCompress = () =>
        job.run({
            jobEndpoint: apiEndpoints.COMPRESS_PDF,
            buildPayload: (fileId) => ({ fileId, quality }),
            buildDownloadName: (name) => `${name.replace(/\.pdf$/i, '')}-compressed.pdf`,
            failedMessage: t('pdfTools.compressFailed'),
            genericErrorMessage: t('pdfTools.compressGenericError'),
        });

    const runTranslate = () =>
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

    const runConvert = () => {
        const [direction, formatKey] = selectedTool.split(':');
        if (direction === 'from-pdf') {
            const config = FROM_PDF_FORMATS[formatKey];
            return job.run({
                jobEndpoint: apiEndpoints.CONVERT_FROM_PDF,
                buildPayload: (fileId) => ({ fileId, targetFormat: config.convertFormat }),
                buildDownloadName: (name) => name.replace(/\.pdf$/i, '') + config.extension,
                failedMessage: t('pdfTools.convertFailed'),
                genericErrorMessage: t('pdfTools.convertGenericError'),
            });
        }
        return job.run({
            jobEndpoint: apiEndpoints.CONVERT_TO_PDF,
            buildPayload: (fileId) => ({ fileId }),
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
        if (!job.file) return;

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
            const bytes = await job.file.arrayBuffer();
            const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
            const baseName = job.file.name.replace(/\.pdf$/i, '');

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
    const jobStatusLabel = {
        uploading: t('pdfTools.uploadingStatus'),
        PENDING: t('pdfTools.queuedStatus'),
        PROCESSING: t(processingStatusKey),
    }[job.step];
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

    return (
        <div className="relative pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    {!selectedTool ? (
                        <div className="space-y-10">
                            <div>
                                <h3 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-700 sm:text-xl">
                                    {t('pdfTools.hubTitle')}
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {SIMPLE_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => selectTool(tool.id)}
                                            className="rounded-lg border border-gray-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                        >
                                            <tool.icon size={26} className="mb-2 text-purple-600" />
                                            <span className="block text-lg font-semibold text-gray-900">{tool.title}</span>
                                            <span className="mt-1 block text-sm text-gray-500">{tool.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-700 sm:text-xl">
                                    {t('pdfTools.fromPdfSection')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {FROM_PDF_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => selectTool(tool.id)}
                                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                        >
                                            <tool.icon size={22} className="shrink-0 text-purple-600" />
                                            <span className="truncate text-base font-medium text-gray-800">{tool.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-700 sm:text-xl">
                                    {t('pdfTools.toPdfSection')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {TO_PDF_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => selectTool(tool.id)}
                                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                                        >
                                            <tool.icon size={22} className="shrink-0 text-purple-600" />
                                            <span className="truncate text-base font-medium text-gray-800">{tool.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <button
                                onClick={resetPanel}
                                disabled={isPanelBusy}
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 disabled:opacity-50"
                            >
                                <ArrowLeft size={16} /> {t('publicFile.backToToolList')}
                            </button>

                            {!job.file ? (
                                <PdfDropzone
                                    onFiles={handleFiles}
                                    label={dropzoneConfig.label}
                                    accept={dropzoneConfig.accept}
                                    extensions={dropzoneConfig.extensions}
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
                                    {!isPanelBusy && (
                                        <button onClick={removeFile} title={t('pdfTools.remove')} className="text-gray-400 hover:text-red-500">
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {job.file && selectedTool === 'split' && (
                                <div className="space-y-5">
                                    {splitReading ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Loader2 size={18} className="animate-spin" /> {t('common.loading')}
                                        </div>
                                    ) : splitPageCount > 0 ? (
                                        <>
                                            <div className="rounded-lg border border-gray-200 p-5">
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
                            )}

                            {job.file && selectedTool !== 'split' && (
                                <div className="space-y-5">
                                    {toolCategory === 'compress' && (
                                        <div className="rounded-lg border border-gray-200 p-5">
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

                                    {job.step !== 'awaiting-login' && job.step !== 'completed' && (
                                        <button
                                            onClick={handleRunTool}
                                            disabled={job.isBusy}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {job.isBusy ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" /> {jobStatusLabel}
                                                </>
                                            ) : (
                                                t(runButtonLabelKey)
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
                                            {t(successMessageKey)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode="signin"
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={() => job.completeDownload(t(genericErrorKey))}
            />
        </div>
    );
};

export default PdfToolsSection;
