import { useCallback, useState } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';
import { useTranslation } from '../context/LanguageContext.jsx';

export const useFileUpload = ({ token, maxFiles = 5, onUploadSuccess }) => {
    const { t } = useTranslation();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleFileChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);

        setFiles((prevFiles) => {
            if (prevFiles.length + selectedFiles.length > maxFiles) {
                setMessage(t('upload.maxFilesError', { max: maxFiles }));
                setMessageType('error');
                return prevFiles;
            }

            setMessage('');
            setMessageType('');
            return [...prevFiles, ...selectedFiles];
        });
    }, [maxFiles, t]);

    const handleRemoveFile = useCallback((index) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setMessage('');
        setMessageType('');
    }, []);

    const handleUpload = useCallback(async () => {
        if (files.length === 0) {
            setMessage(t('upload.selectAtLeastOne'));
            setMessageType('error');
            return;
        }

        if (files.length > maxFiles) {
            setMessage(t('upload.maxFilesError', { max: maxFiles }));
            setMessageType('error');
            return;
        }

        setUploading(true);
        setMessage(t('dashboard.uploading'));
        setMessageType('info');

        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        try {
            const response = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessage(t('upload.uploadSuccess'));
            setMessageType('success');
            setFiles([]);

            await onUploadSuccess?.(response.data);
        } catch (error) {
            console.error('Error uploading files:', error);
            setMessage(error.response?.data?.message || t('upload.uploadError'));
            setMessageType('error');
        } finally {
            setUploading(false);
        }
    }, [files, maxFiles, token, onUploadSuccess, t]);

    return {
        files,
        uploading,
        message,
        messageType,
        remaining: maxFiles - files.length,
        handleFileChange,
        handleRemoveFile,
        handleUpload,
    };
};
