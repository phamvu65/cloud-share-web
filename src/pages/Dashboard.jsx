import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useCallback, useContext, useEffect, useState} from "react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import {Loader2} from "lucide-react";
import DashboardUpload from "../components/DashboardUpload.jsx";
import RecentFiles from "../components/RecentFiles.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFileUpload } from "../hooks/useFileUpload.js";

const MAX_FILES = 5;

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const { token, isLoading: isAuthLoading } = useAuth();
    const { fetchUserCredits } = useContext(UserCreditsContext);

    const fetchRecentFiles = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(apiEndpoints.FETCH_FILES, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            // Sort by uploadedAt and take only the 5 most recent files
            const sortedFiles = res.data.sort((a, b) =>
                new Date(b.uploadedAt) - new Date(a.uploadedAt)
            ).slice(0, 5);
            setFiles(sortedFiles);
        } catch (error) {
            console.error("Error fetching recent files:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRecentFiles();
    }, [fetchRecentFiles]);

    const {
        files: uploadFiles,
        uploading,
        message,
        messageType,
        remaining: remainingUploads,
        handleFileChange,
        handleRemoveFile,
        handleUpload,
    } = useFileUpload({
        token,
        maxFiles: MAX_FILES,
        onUploadSuccess: async () => {
            await Promise.all([fetchRecentFiles(), fetchUserCredits()]);
        },
    });

    if (isAuthLoading) {
        return <DashboardLayout activeMenu="Dashboard"><div className="p-6">Loading...</div></DashboardLayout>;
    }

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className="p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Drive</h1>
                        <p className="text-gray-600">Upload, manage, and share your files securely</p>
                    </div>
                </div>
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                        messageType === 'error' ? 'bg-red-50 text-red-700' :
                            messageType === 'success' ? 'bg-green-50 text-green-700' :
                                'bg-purple-50 text-purple-700'
                    }`}>
                        {message}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-6">
                    {/*Left column*/}
                    <div className="w-full md:w-[40%]">
                        <DashboardUpload
                            files={uploadFiles}
                            onFileChange={handleFileChange}
                            onUpload={handleUpload}
                            uploading={uploading}
                            onRemoveFile={handleRemoveFile}
                            remainingUploads={remainingUploads}
                        />
                    </div>

                    {/*right column*/}
                    <div className="w-full md:w-[60%]">
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center min-h-75">
                                <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
                                <p className="text-gray-500">Loading your files...</p>
                            </div>
                        ) : (
                            <RecentFiles files={files} />
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Dashboard;
