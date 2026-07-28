import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getPreviewKind, getPreviewMimeType } from '../util/filePreview.js';
import { useTranslation } from '../context/LanguageContext.jsx';

const INITIAL_STATE = { isOpen: false, file: null, url: '', kind: 'unsupported', loading: false, error: '' };

export const useFilePreview = () => {
    const { t } = useTranslation();
    const [state, setState] = useState(INITIAL_STATE);
    const objectUrlRef = useRef('');

    const revokeCurrentUrl = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = '';
        }
    };

    const close = useCallback(() => {
        revokeCurrentUrl();
        setState(INITIAL_STATE);
    }, []);

    // fetchUrl/config let callers pass either an authenticated or public request
    const open = useCallback(async (file, fetchUrl, config) => {
        revokeCurrentUrl();
        const kind = getPreviewKind(file);
        setState({ isOpen: true, file, url: '', kind, loading: kind !== 'unsupported', error: '' });

        if (kind === 'unsupported') {
            return;
        }

        try {
            const response = await axios.get(fetchUrl, { ...config, responseType: 'blob' });
            const mimeType = getPreviewMimeType(kind, file);
            const blob = mimeType && response.data.type !== mimeType
                ? new Blob([response.data], { type: mimeType })
                : response.data;
            const objectUrl = URL.createObjectURL(blob);
            objectUrlRef.current = objectUrl;
            setState({ isOpen: true, file, url: objectUrl, kind, loading: false, error: '' });
        } catch (error) {
            console.error('Error loading file preview:', error);
            setState({ isOpen: true, file, url: '', kind, loading: false, error: t('filePreview.loadError') });
        }
    }, [t]);

    useEffect(() => () => revokeCurrentUrl(), []);

    return { ...state, open, close };
};
