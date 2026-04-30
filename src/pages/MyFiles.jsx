import DashboardLayout from "../layout/DashboardLayout.jsx";
import { useEffect, useState } from "react";
import { Download, File, Grid, List, Trash2, Globe, Lock, Copy, Eye } from "lucide-react"; // Added missing imports
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const token = await getToken();
      // Ensure your backend endpoint is correct. Previously it was apiEndpoints.FETCH_FILES
      const response = await axios.get('http://localhost:8080/api/v1.0/files/my', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (response.status === 200) {
         // Assuming the backend returns the array directly, or response.data.files
        setFiles(response.data.files || response.data); 
      }
    } catch (error) {
      console.error('Error fetching the files from server: ', error);
      toast.error('Error fetching the files from server: ' + error.message);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, [getToken]);

  // Placeholder functions for the actions to prevent errors
  const onTogglePublic = (file) => { console.log("Toggle public", file); };
  const onShareLink = (id) => { console.log("Share link", id); };
  const onDownload = (file) => { console.log("Download", file); };
  const onDelete = (id) => { console.log("Delete", id); };

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
                        <button onClick={() => onTogglePublic(file)} className="flex items-center gap-2 cursor-pointer group">
                          {file.isPublic ? (
                            <><Globe size={16} className="text-green-500" /><span className="group-hover:underline">Public</span></>
                          ) : (
                            <><Lock size={16} className="text-gray-500" /><span className="group-hover:underline">Private</span></>
                          )}
                        </button>
                        {file.isPublic && (
                          <button onClick={() => onShareLink(file.id)} className="flex items-center gap-2 cursor-pointer group text-blue-600">
                            <Copy size={16} />
                            <span className="group-hover:underline">Share</span>
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center gap-4">
                        <button onClick={() => onDownload(file)} title="Download" className="text-gray-500 hover:text-blue-600"><Download size={18} /></button>
                        <button onClick={() => onDelete(file.id)} title="Delete" className="text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                        {file.isPublic ? (
                           <a href={`/file/${file.id}`} title="View File" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600"><Eye size={18} /></a>
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
                    <button onClick={() => onTogglePublic(file)} className="p-1 rounded hover:bg-gray-100">
                        {file.isPublic ? <Globe size={16} className="text-green-500" /> : <Lock size={16} className="text-gray-500" />}
                    </button>
                 </div>
                 <h4 className="font-medium text-gray-800 truncate mb-1" title={file.name}>{file.name}</h4>
                 <p className="text-xs text-gray-500 mb-4">{(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                 
                 <div className="mt-auto flex justify-end gap-3 pt-3 border-t">
                     {file.isPublic && (
                        <button onClick={() => onShareLink(file.id)} title="Share" className="text-gray-500 hover:text-blue-600"><Copy size={16} /></button>
                     )}
                     <button onClick={() => onDownload(file)} title="Download" className="text-gray-500 hover:text-blue-600"><Download size={16} /></button>
                     <button onClick={() => onDelete(file.id)} title="Delete" className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MyFiles;