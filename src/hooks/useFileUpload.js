import { useCallback, useState } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';

export const useFileUpload = ({ token, maxFiles = 5, onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleFileChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);

        setFiles((prevFiles) => {
            if (prevFiles.length + selectedFiles.length > maxFiles) {
                setMessage(`You can only upload a maximum of ${maxFiles} files at once.`);
                setMessageType('error');
                return prevFiles;
            }

            setMessage('');
            setMessageType('');
            return [...prevFiles, ...selectedFiles];
        });
    }, [maxFiles]);

    const handleRemoveFile = useCallback((index) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setMessage('');
        setMessageType('');
    }, []);

    const handleUpload = useCallback(async () => {
        if (files.length === 0) {
            setMessage('Please select at least one file to upload.');
            setMessageType('error');
            return;
        }

        if (files.length > maxFiles) {
            setMessage(`You can only upload a maximum of ${maxFiles} files at once.`);
            setMessageType('error');
            return;
        }

        setUploading(true);
        setMessage('Uploading files...');
        setMessageType('info');

        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        try {
            const response = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessage('Files uploaded successfully!');
            setMessageType('success');
            setFiles([]);

            await onUploadSuccess?.(response.data);
        } catch (error) {
            console.error('Error uploading files:', error);
            setMessage(error.response?.data?.message || 'Error uploading files. Please try again.');
            setMessageType('error');
        } finally {
            setUploading(false);
        }
    }, [files, maxFiles, token, onUploadSuccess]);

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
