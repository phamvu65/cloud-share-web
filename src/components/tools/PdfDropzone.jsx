import { useRef } from 'react';
import { FileUp } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.jsx';

const DEFAULT_EXTENSIONS = ['pdf'];

const PdfDropzone = ({ multiple = false, onFiles, label, accept = 'application/pdf', extensions = DEFAULT_EXTENSIONS }) => {
    const inputRef = useRef(null);
    const { t } = useTranslation();

    const handleFiles = (fileList) => {
        const matching = Array.from(fileList).filter((f) => {
            const ext = f.name.toLowerCase().split('.').pop();
            return extensions.includes(ext);
        });
        if (matching.length > 0) onFiles(matching);
    };

    return (
        <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-colors hover:border-purple-500"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
            }}
        >
            <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-purple-50 p-3">
                    <FileUp size={24} className="text-purple-600" />
                </div>
            </div>
            <p className="text-gray-700">{label || t('pdfTools.dropzoneLabel')}</p>
            <p className="mt-1 text-sm text-gray-500">
                {multiple ? t('pdfTools.dropzoneBrowseMultiple') : t('pdfTools.dropzoneBrowse')}
            </p>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) handleFiles(e.target.files);
                    e.target.value = '';
                }}
            />
        </div>
    );
};

export default PdfDropzone;
