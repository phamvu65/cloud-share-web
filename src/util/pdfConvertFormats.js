import { FileSpreadsheet, FileText, FileType, Image, Presentation } from 'lucide-react';

// PDF -> other format. `convertFormat` matches the backend's ConvertFormat enum.
export const FROM_PDF_FORMATS = {
    word: { convertFormat: 'WORD', extension: '.docx', displayName: 'Word', icon: FileType },
    png: { convertFormat: 'PNG', extension: '.png', displayName: 'PNG', icon: Image },
    jpg: { convertFormat: 'JPG', extension: '.jpg', displayName: 'JPG', icon: Image },
    html: { convertFormat: 'HTML', extension: '.html', displayName: 'HTML', icon: FileText },
};

// Other format -> PDF. Source format is auto-detected by the backend, so we
// only need the accepted input extensions here.
export const TO_PDF_FORMATS = {
    word: { extensions: ['doc', 'docx'], accept: '.doc,.docx', displayName: 'Word', icon: FileType },
    png: { extensions: ['png'], accept: '.png', displayName: 'PNG', icon: Image },
    jpg: { extensions: ['jpg', 'jpeg'], accept: '.jpg,.jpeg', displayName: 'JPG', icon: Image },
    pptx: { extensions: ['pptx'], accept: '.pptx', displayName: 'PowerPoint', icon: Presentation },
    excel: { extensions: ['xlsx', 'xls'], accept: '.xlsx,.xls', displayName: 'Excel', icon: FileSpreadsheet },
    html: { extensions: ['html', 'htm'], accept: '.html,.htm', displayName: 'HTML', icon: FileText },
};
