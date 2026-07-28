import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import { downloadBlob, formatFileSize } from '../../util/downloadBlob.js';
import { everyPageAsRange, parsePageRanges } from '../../util/pdfPageRanges.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, FileText, Loader2, X } from 'lucide-react';

const SplitPdf = () => {
    const [file, setFile] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [mode, setMode] = useState('each'); // 'each' | 'custom'
    const [rangesInput, setRangesInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleFiles = async (files) => {
        const selected = files[0];
        setError('');
        try {
            const bytes = await selected.arrayBuffer();
            const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
            setPageCount(doc.getPageCount());
            setFile(selected);
        } catch (err) {
            console.error('Error reading PDF:', err);
            setError(t('pdfTools.readError'));
        }
    };

    const handleReset = () => {
        setFile(null);
        setPageCount(0);
        setRangesInput('');
        setError('');
    };

    const handleSplit = async () => {
        if (!file) return;
        setError('');

        let ranges;
        try {
            ranges = mode === 'each' ? everyPageAsRange(pageCount) : parsePageRanges(rangesInput, pageCount);
        } catch (err) {
            setError(err.message);
            return;
        }

        setProcessing(true);
        try {
            const bytes = await file.arrayBuffer();
            const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
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
            setError(t('pdfTools.splitError'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PdfToolLayout title={t('pdfTools.splitPageTitle')} description={t('pdfTools.splitPageDescription')}>
            <div className="space-y-6">
                {!file ? (
                    <PdfDropzone onFiles={handleFiles} label={t('pdfTools.dropzoneLabelSingle')} />
                ) : (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-blue-600" size={22} />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • {pageCount} {t('pdfTools.pages')}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleReset} title={t('pdfTools.remove')} className="text-gray-400 hover:text-red-500">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {file && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => setMode('each')}
                                className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${
                                    mode === 'each'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {t('pdfTools.splitEachPage')}
                            </button>
                            <button
                                onClick={() => setMode('custom')}
                                className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${
                                    mode === 'custom'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {t('pdfTools.splitCustomRange')}
                            </button>
                        </div>

                        {mode === 'custom' && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    {t('pdfTools.splitRangeLabel', { count: pageCount || 'N' })}
                                </label>
                                <input
                                    type="text"
                                    value={rangesInput}
                                    onChange={(e) => setRangesInput(e.target.value)}
                                    placeholder={`vd: 1-3, 5, 8-${pageCount}`}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                />
                            </div>
                        )}
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
                        onClick={handleSplit}
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> {t('pdfTools.splitting')}
                            </>
                        ) : (
                            t('pdfTools.splitButton')
                        )}
                    </button>
                )}
            </div>
        </PdfToolLayout>
    );
};

export default SplitPdf;
