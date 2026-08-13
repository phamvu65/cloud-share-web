// Persists the one PDF job result a signed-out user is waiting to download, so the download
// can still be resumed after a page refresh or a login that happens somewhere other than the
// tool page itself (e.g. the navbar's auth modal). Only one pending download is tracked at a
// time, matching the current one-tool-at-a-time UI.
const STORAGE_KEY = 'pdfPendingDownload';

export const savePendingDownload = (jobId, downloadName) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobId, downloadName }));
    } catch {
        // localStorage unavailable (private mode, quota) - the in-memory fallback in
        // usePdfJob still covers the common same-tab, no-refresh case.
    }
};

export const readPendingDownload = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearPendingDownload = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
};
