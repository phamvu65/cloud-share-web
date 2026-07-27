const IMAGE_MIME_BY_EXTENSION = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
};

const VIDEO_MIME_BY_EXTENSION = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
};

const AUDIO_MIME_BY_EXTENSION = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    oga: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    aac: 'audio/aac',
    weba: 'audio/webm',
};

const getExtension = (file) => (file?.name || '').toLowerCase().split('.').pop() || '';

export const getPreviewKind = (file) => {
    const type = (file?.type || '').toLowerCase();
    const extension = getExtension(file);

    if (type.startsWith('image/') || IMAGE_MIME_BY_EXTENSION[extension]) {
        return 'image';
    }

    if (type === 'application/pdf' || extension === 'pdf') {
        return 'pdf';
    }

    if (type.startsWith('video/') || VIDEO_MIME_BY_EXTENSION[extension]) {
        return 'video';
    }

    if (type.startsWith('audio/') || AUDIO_MIME_BY_EXTENSION[extension]) {
        return 'audio';
    }

    return 'unsupported';
};

// The download endpoint's Content-Type isn't reliable (some backends serve every
// file as application/octet-stream), which stops the browser's built-in viewers
// (PDF/video/audio) from kicking in. Re-derive the MIME type from the file
// extension so previews render regardless of what the server reports.
export const getPreviewMimeType = (kind, file) => {
    const extension = getExtension(file);
    if (kind === 'pdf') return 'application/pdf';
    if (kind === 'image') return IMAGE_MIME_BY_EXTENSION[extension] || 'image/png';
    if (kind === 'video') return VIDEO_MIME_BY_EXTENSION[extension] || 'video/mp4';
    if (kind === 'audio') return AUDIO_MIME_BY_EXTENSION[extension] || 'audio/mpeg';
    return '';
};
