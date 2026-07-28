import DashboardLayout from '../layout/DashboardLayout.jsx';
import { useContext } from 'react';
import { UserCreditsContext } from '../context/UserCreditsContext.jsx';
import { AlertCircle } from 'lucide-react';
import UploadBox from '../components/UploadBox.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFileUpload } from '../hooks/useFileUpload.js';

const MAX_FILES = 5;

const Upload = () => {
    const { token } = useAuth();
    const { credits, fetchUserCredits } = useContext(UserCreditsContext);

    const { files, uploading, message, messageType, handleFileChange, handleRemoveFile, handleUpload } = useFileUpload({
        token,
        maxFiles: MAX_FILES,
        onUploadSuccess: fetchUserCredits,
    });

    const isUploadDisabled = files.length === 0 || files.length > MAX_FILES || credits <= 0 || files.length > credits;

    return (
        <DashboardLayout activeMenu="upload">
            <div className="p-6">
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${messageType === 'error' ? 'bg-red-50 text-red-700' : messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}
                    >
                        {messageType === 'error' && <AlertCircle size={20} />}
                        {message}
                    </div>
                )}

                <UploadBox
                    files={files}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                    uploading={uploading}
                    onRemoveFile={handleRemoveFile}
                    remainingCredits={credits}
                    isUploadDisabled={isUploadDisabled}
                />
            </div>
        </DashboardLayout>
    );
};

export default Upload;
