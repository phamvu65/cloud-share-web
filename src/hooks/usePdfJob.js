import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';
import { downloadBlob } from '../util/downloadBlob.js';
import { clearPendingDownload, savePendingDownload } from '../util/pendingDownload.js';
import { useAuth } from '../context/AuthContext.jsx';

const POLL_INTERVAL_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The upload endpoint's response shape isn't perfectly consistent across the
// app's existing pages ({ files: [...] } vs a bare array) - handle both.
const extractUploadedFileId = (data) => {
    const candidate = Array.isArray(data) ? data[0] : data?.files?.[0] || data?.file || data;
    return candidate?.id || null;
};

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// Shared upload -> submit job -> poll -> download flow used by every async PDF job
// tool (compress, translate, convert from/to PDF). Uploading and processing work
// without an account; only the final download requires being logged in - if the job
// finishes while the user is still anonymous, the flow parks in 'awaiting-login'
// until the caller signs in and calls completeDownload().
export const usePdfJob = () => {
    const { token, isAuthenticated } = useAuth();

    const [file, setFile] = useState(null);
    const [step, setStep] = useState('idle'); // idle | uploading | PENDING | PROCESSING | awaiting-login | completed | failed
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0); // 0-100, best-effort estimate shown on the progress bar
    const isCancelledRef = useRef(false);
    const pendingDownloadRef = useRef(null); // { jobId, downloadName } once completed but not yet downloaded

    useEffect(() => {
        isCancelledRef.current = false;
        return () => {
            isCancelledRef.current = true;
        };
    }, []);

    const handleFiles = (files) => {
        setFile(files[0]);
        setStep('idle');
        setError('');
        setProgress(0);
    };

    const reset = () => {
        setFile(null);
        setStep('idle');
        setError('');
        setProgress(0);
        pendingDownloadRef.current = null;
        clearPendingDownload();
    };

    // The server doesn't report a real completion percentage while a job is
    // PENDING/PROCESSING, so nudge the bar forward on every poll tick (capped
    // well short of 100) unless the job response includes its own `progress`.
    const pollJob = async (jobId) => {
        while (!isCancelledRef.current) {
            const res = await axios.get(apiEndpoints.GET_PDF_JOB(jobId), {
                headers: authHeaders(token),
            });
            const job = res.data;

            if (isCancelledRef.current) return null;
            setStep(job.status);

            if (typeof job.progress === 'number') {
                setProgress(Math.min(99, Math.max(30, job.progress)));
            } else {
                // Ease toward the cap instead of jumping by a fixed amount, so the bar
                // keeps crawling forward on long jobs instead of stalling at 90% early.
                setProgress((prev) => Math.min(90, prev + Math.max(1, Math.round((90 - prev) * 0.1))));
            }

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
                if (job.status === 'COMPLETED') setProgress(100);
                return job;
            }
            await sleep(POLL_INTERVAL_MS);
        }
        return null;
    };

    // The server deletes the result (and the source file, once unused) as soon as this
    // download completes - it can only ever be fetched once.
    const downloadFinishedJob = async (jobId, downloadName) => {
        const downloadRes = await axios.get(apiEndpoints.DOWNLOAD_PDF_JOB_RESULT(jobId), {
            headers: authHeaders(token),
            responseType: 'blob',
        });
        downloadBlob(downloadRes.data, downloadName);
    };

    /**
     * Call once the user has logged in after a job finished while they were anonymous
     * (step === 'awaiting-login'). Downloads the parked job result.
     */
    const completeDownload = async (genericErrorMessage) => {
        const pending = pendingDownloadRef.current;
        if (!pending) return;

        try {
            await downloadFinishedJob(pending.jobId, pending.downloadName);
            pendingDownloadRef.current = null;
            clearPendingDownload();
            setStep('completed');
        } catch (err) {
            console.error('Error downloading PDF job result:', err);
            setError(err.response?.data?.message || genericErrorMessage);
            setStep('failed');
        }
    };

    /**
     * jobEndpoint: the apiEndpoints URL to POST the job to.
     * buildPayload(fileId): returns the job request body.
     * buildDownloadName(originalFileName): returns the filename for the downloaded result.
     * failedMessage / genericErrorMessage: user-facing fallback error copy.
     * sourceFile: optional { id, name } for a file that already exists on the server
     * (e.g. a publicly shared file) - when given, the upload step is skipped and the
     * job runs directly against that file instead of the locally-picked `file` state.
     */
    const run = async ({ jobEndpoint, buildPayload, buildDownloadName, failedMessage, genericErrorMessage, sourceFile }) => {
        const activeFile = sourceFile || file;
        if (!activeFile) return;
        setError('');
        setProgress(0);

        try {
            let fileId;
            if (sourceFile) {
                fileId = sourceFile.id;
            } else {
                setStep('uploading');
                const formData = new FormData();
                formData.append('files', file);
                const uploadRes = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                    headers: authHeaders(token),
                    onUploadProgress: (event) => {
                        if (event.total) setProgress(Math.round((event.loaded / event.total) * 25));
                    },
                });

                fileId = extractUploadedFileId(uploadRes.data);
                if (!fileId) {
                    throw new Error('missing-file-id');
                }
            }

            setProgress(30);
            setStep('PENDING');
            const jobRes = await axios.post(jobEndpoint, buildPayload(fileId), {
                headers: authHeaders(token),
            });

            const finalJob = await pollJob(jobRes.data.id);
            if (!finalJob) return;

            if (finalJob.status === 'FAILED') {
                setError(finalJob.errorMessage || failedMessage);
                setStep('failed');
            } else if (isAuthenticated) {
                await downloadFinishedJob(finalJob.id, buildDownloadName(activeFile.name));
                setStep('completed');
            } else {
                // Job is done and waiting on disk - park it until the user signs in. Persisted
                // to localStorage too, so the download can still resume after a page refresh
                // or a login that happens somewhere other than this page (e.g. the navbar).
                const pending = { jobId: finalJob.id, downloadName: buildDownloadName(activeFile.name) };
                pendingDownloadRef.current = pending;
                savePendingDownload(pending.jobId, pending.downloadName);
                setStep('awaiting-login');
            }
        } catch (err) {
            console.error('Error running PDF job:', err);
            setError(err.response?.data?.message || genericErrorMessage);
            setStep('failed');
        }
    };

    const isBusy = step === 'uploading' || step === 'PENDING' || step === 'PROCESSING';

    return { file, handleFiles, reset, step, error, progress, isBusy, isAuthenticated, run, completeDownload };
};
