import { createPortal } from 'react-dom';
import { Download, FileWarning, Loader2, Music, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.jsx';

const FilePreviewModal = ({ isOpen, file, url, kind, loading, error, onClose, onDownload }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8" onClick={onClose}>
            <div
                className="flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h3 className="truncate pr-4 text-sm font-semibold text-gray-900" title={file?.name}>
                        {file?.name}
                    </h3>
                    <div className="flex items-center gap-1">
                        {onDownload && (
                            <button
                                type="button"
                                onClick={onDownload}
                                title={t('common.download')}
                                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                                <Download size={18} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            title={t('common.close')}
                            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-gray-100">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-sm">{t('filePreview.loading')}</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-500">
                            <FileWarning size={32} />
                            <span className="text-sm">{error}</span>
                        </div>
                    ) : kind === 'image' ? (
                        <img src={url} alt={file?.name} className="h-full max-h-full w-full object-contain" />
                    ) : kind === 'pdf' ? (
                        <iframe src={url} title={file?.name} className="h-full w-full border-0" />
                    ) : kind === 'video' ? (
                        <video src={url} controls className="max-h-full max-w-full" />
                    ) : kind === 'audio' ? (
                        <div className="flex w-full max-w-md flex-col items-center gap-6 p-8">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                <Music size={32} />
                            </div>
                            <p className="max-w-full truncate text-sm font-medium text-gray-700" title={file?.name}>
                                {file?.name}
                            </p>
                            <audio src={url} controls className="w-full" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-500">
                            <FileWarning size={32} />
                            <span className="text-sm">{t('filePreview.unsupported')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default FilePreviewModal;
