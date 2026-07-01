import DashboardLayout from "../layout/DashboardLayout.jsx";
import { useEffect, useState } from "react";
import { Download, File, Grid, List, Trash2, Globe, Lock, Copy, Eye } from "lucide-react"; // Added missing imports
import axios from "axios";
import toast from "react-hot-toast";
import { apiEndpoints } from "../util/apiEndpoints.js";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal.jsx";
import ConfirmationDialog from "../components/ConfirmationDialog.jsx";
import LinkShareModal from "../components/LinkShareModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [shareModal,setShareModal] = useState({
    isOpen: false,
    fileId: null,
    link:""
  });

  //fetching the files for a logged in user
  const fetchFiles = async () => {
    if (!token) return;
    try {
      // Ensure your backend endpoint is correct. Previously it was apiEndpoints.FETCH_FILES
      const response = await axios.get(apiEndpoints.FETCH_FILES, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        // Assuming the backend returns the array directly, or response.data.files
        console.log(response.data);
        setFiles(response.data.files || response.data);
      }
    } catch (error) {
      console.error('Error fetching the files from server: ', error);
      toast.error('Error fetching the files from server: ' + error.message);
    }
  }

  //Toggles the public/private status of a file
  const togglePublic = async (fileToUpdate) => {
    if (!token) return;
    try {
      await axios.patch(apiEndpoints.TOGGLE_FILE(fileToUpdate.id), {}, { headers: { Authorization: `Bearer ${token}` } });
      console.log('data', fileToUpdate);
      setFiles(files.map((file) => file.id === fileToUpdate.id ? { ...file, isPublic: !file.isPublic } : file));
    } catch (error) {
      console.error('Error toggling file status', error);
      toast.error('Error toggling file status: ', error.message);
    }
  }

  //Handle file download
  const handleDownload = async (file) => {
    if (!token) return;
    try {
      const response = await axios.get(apiEndpoints.DOWNLOAD_FILE(file.id), { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });

      // create a blob url and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // clean up the object url
    } catch (error) {
      console.error('Download failed', error);
      toast.error('Error downloading file', error.message);
    }
  }

  //handle file deletion
  const handleDelete = (file) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (!token) return;
    try {
      await axios.delete(apiEndpoints.DELETE_FILE(fileToDelete.id), { headers: { Authorization: `Bearer ${token}` } });
      setFiles(files.filter((file) => file.id !== fileToDelete.id));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file', error);
      toast.error('Error deleting file: ' + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
    }
  }

  //opens the share link modal
  const openShareModal = (fileId) => {
    const link = `${window.location.origin}/file/${fileId}`;
    setShareModal({ isOpen: true, fileId, link });
  };

  //closes the share link modal
  const closeShareModal = () => {
    setShareModal({ isOpen: false, fileId: null, link: "" });
  };

    useEffect(() => {
      fetchFiles();
    }, [token]);

    return (
      <DashboardLayout activeMenu="My Files">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Files ({files.length})</h2>
            <div className="flex items-center gap-3">
              <List
                onClick={() => setViewMode("list")}
                size={24}
                className={`cursor-pointer transition-colors ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} />
              <Grid
                onClick={() => setViewMode("grid")}
                size={24}
                className={`cursor-pointer transition-colors ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} />
            </div>
          </div>

          {files.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center">
              <File size={60} className="text-purple-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No files uploaded yet</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Start uploading files to see them listed here. You can upload documents, images, and other files to share and manage them securely.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
                Go to Upload
              </button>
            </div>
          ) : viewMode === "list" ? (
            // List View (Table Structure)
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <File size={20} className="text-blue-600" />
                          {file.name}
                        </div>
                      </td>
                      {/* Size */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      {/* Visibility */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => togglePublic(file)}
                            className="flex items-center gap-2 cursor-pointer group">
                            {file.isPublic ? (
                              <><Globe size={16} className="text-green-500" /><span className="group-hover:underline">Public</span></>
                            ) : (
                              <><Lock size={16} className="text-gray-500" /><span className="group-hover:underline">Private</span></>
                            )}
                          </button>
                          {file.isPublic && (
                            <button
                              onClick={() => setShareModal({ isOpen: true, link: `${window.location.origin}/file/${file.id}` })}
                              className="flex items-center gap-2 cursor-pointer group text-blue-600">
                              <Copy size={16} />
                              <span className="group-hover:underline">Share</span>
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleDownload(file)}
                            title="Download" className="text-gray-500 hover:text-blue-600">
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            title="Delete" className="text-gray-500 hover:text-red-600">
                            <Trash2 size={18} />
                          </button>
                          {file.isPublic ? (
                            <a href={`/file/${file.id}`}
                              title="View File" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600">
                              <Eye size={18} />
                            </a>
                          ) : <span className="w-[18px]"></span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Grid View (Card Structure)
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files.map((file) => (
                <div key={file.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <File size={32} className="text-blue-600" />
                    <button onClick={() => togglePublic(file)} className="p-1 rounded hover:bg-gray-100">
                      {file.isPublic ? <Globe size={16} className="text-green-500" /> : <Lock size={16} className="text-gray-500" />}
                    </button>
                  </div>
                  <h4 className="font-medium text-gray-800 truncate mb-1" title={file.name}>{file.name}</h4>
                  <p className="text-xs text-gray-500 mb-4">{(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}</p>

                  <div className="mt-auto flex justify-end gap-3 pt-3 border-t">
                    {file.isPublic && (
                      <button onClick={() => setShareModal({ isOpen: true, link: `${window.location.origin}/file/${file.id}` })} title="Share" className="text-gray-500 hover:text-blue-600"><Copy size={16} /></button>
                    )}
                    <button onClick={() => handleDownload(file)} title="Download" className="text-gray-500 hover:text-blue-600"><Download size={16} /></button>
                    <button onClick={() => handleDelete(file)} title="Delete" className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          confirmText="Delete File"
          cancelText="Cancel"
          confirmButtonClass="bg-red-500 hover:bg-red-600 focus:ring-red-500" // Đổi nút Confirm thành màu đỏ cho đúng chuẩn UX cảnh báo
          onConfirm={confirmDelete}
        >
          <div className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-800">"{fileToDelete?.name}"</span>?
            This action cannot be undone and the file will be permanently removed from our servers.
          </div>
        </Modal>

      {/* Share Link Modal */}
      <LinkShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, link: "" })}
        link={shareModal.link}
        title="Share File"
      />
      </DashboardLayout>
    )
  }

  export default MyFiles;