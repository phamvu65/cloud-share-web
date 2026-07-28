import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import PdfToolLayout from '../../layout/PdfToolLayout.jsx';
import PdfDropzone from '../../components/tools/PdfDropzone.jsx';
import { downloadBlob, formatFileSize } from '../../util/downloadBlob.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { AlertCircle, ArrowDown, ArrowUp, FileText, Loader2, X } from 'lucide-react';

const MergePdf = () => {
    const [files, setFiles] = useState([]);
    const [merging, setMerging] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleFiles = (newFiles) => {
        setFiles((prev) => [...prev, ...newFiles]);
        setError('');
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const moveFile = (index, direction) => {
        setFiles((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError(t('pdfTools.mergeAtLeastTwo'));
            return;
        }

        setMerging(true);
        setError('');

        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const bytes = await file.arrayBuffer();
                const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(src, src.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedBytes = await mergedPdf.save();
            downloadBlob(new Blob([mergedBytes], { type: 'application/pdf' }), 'merged.pdf');
        } catch (err) {
            console.error('Error merging PDFs:', err);
            setError(t('pdfTools.mergeError'));
        } finally {
            setMerging(false);
        }
    };

    return (
        <PdfToolLayout title={t('pdfTools.mergePageTitle')} description={t('pdfTools.mergePageDescription')}>
            <div className="space-y-6">
                <PdfDropzone multiple onFiles={handleFiles} label={t('pdfTools.dropzoneLabel')} />

                {files.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between border-b border-gray-100 p-3 last:border-b-0"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <FileText className="shrink-0 text-blue-600" size={20} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => moveFile(index, -1)}
                                        disabled={index === 0}
                                        title={t('pdfTools.moveUp')}
                                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => moveFile(index, 1)}
                                        disabled={index === files.length - 1}
                                        title={t('pdfTools.moveDown')}
                                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeFile(index)}
                                        title={t('pdfTools.remove')}
                                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {files.length > 0 && (
                    <button
                        onClick={handleMerge}
                        disabled={merging || files.length < 2}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                        {merging ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> {t('pdfTools.merging')}
                            </>
                        ) : (
                            t('pdfTools.mergeButton', { count: files.length })
                        )}
                    </button>
                )}
            </div>
        </PdfToolLayout>
    );
};

export default MergePdf;
