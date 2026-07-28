import DashboardLayout from '../layout/DashboardLayout.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eye, ExternalLink, File, Grid, List, Trash2, Globe, Lock, Copy } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiEndpoints } from '../util/apiEndpoints.js';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import LinkShareModal from '../components/LinkShareModal.jsx';
import FilePreviewModal from '../components/FilePreviewModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFilePreview } from '../hooks/useFilePreview.js';
import { useTranslation } from '../context/LanguageContext.jsx';
const MyFiles = () => {
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    // deleteTarget: { type: 'single', file } | { type: 'bulk', ids: string[] } | null
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();
    const preview = useFilePreview();
    const { t } = useTranslation();
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        fileId: null,
        link: '',
    });

    // Drag-to-select (marquee) support - like Explorer/Drive: drag over empty
    // space to draw a selection box, click an item to select just it, shift/ctrl
    // to extend the selection.
    const containerRef = useRef(null);
    const itemRefs = useRef(new Map());
    const anchorIndexRef = useRef(null);
    const [dragBox, setDragBox] = useState(null); // { x, y, w, h } relative to containerRef

    const setItemRef = (id) => (el) => {
        if (el) itemRefs.current.set(id, el);
        else itemRefs.current.delete(id);
    };

    //fetching the files for a logged in user
    const fetchFiles = useCallback(async () => {
        if (!token) return;
        try {
            // Ensure your backend endpoint is correct. Previously it was apiEndpoints.FETCH_FILES
            const response = await axios.get(apiEndpoints.FETCH_FILES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                // Assuming the backend returns the array directly, or response.data.files
                console.log(response.data);
                setFiles(response.data.files || response.data);
            }
        } catch (error) {
            console.error('Error fetching the files from server: ', error);
            toast.error(t('myFiles.fetchError', { error: error.message }));
        }
    }, [token, t]);

    //Toggles the public/private status of a file
    const togglePublic = async (fileToUpdate) => {
        if (!token) return;
        try {
            await axios.patch(apiEndpoints.TOGGLE_FILE(fileToUpdate.id), {}, { headers: { Authorization: `Bearer ${token}` } });
            console.log('data', fileToUpdate);
            setFiles(files.map((file) => (file.id === fileToUpdate.id ? { ...file, isPublic: !file.isPublic } : file)));
        } catch (error) {
            console.error('Error toggling file status', error);
            toast.error(t('myFiles.toggleError'));
        }
    };

    //Open the inline preview modal for images/PDFs
    const handlePreview = (file) => {
        if (!token) return;
        preview.open(file, apiEndpoints.DOWNLOAD_FILE(file.id), {
            headers: { Authorization: `Bearer ${token}` },
        });
    };

    //Handle file download
    const handleDownload = async (file) => {
        if (!token) return;
        try {
            const response = await axios.get(apiEndpoints.DOWNLOAD_FILE(file.id), {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            // create a blob url and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // clean up the object url
        } catch (error) {
            console.error('Download failed', error);
            toast.error(t('myFiles.downloadError'));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allSelected = files.length > 0 && selectedIds.size === files.length;

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(files.map((file) => file.id)));
    };

    // Click (mousedown) directly on a row/card: plain click selects just that
    // item, shift extends a range from the last-clicked item, ctrl/cmd toggles it.
    const handleItemMouseDown = (event, file, index) => {
        if (event.button !== 0) return;
        if (event.target.closest('button, a, input, label')) return;

        if (event.shiftKey && anchorIndexRef.current !== null) {
            const [start, end] = [anchorIndexRef.current, index].sort((a, b) => a - b);
            setSelectedIds(new Set(files.slice(start, end + 1).map((f) => f.id)));
        } else if (event.ctrlKey || event.metaKey) {
            toggleSelect(file.id);
            anchorIndexRef.current = index;
        } else {
            setSelectedIds(new Set([file.id]));
            anchorIndexRef.current = index;
        }
    };

    // Mousedown on empty background inside the list/grid: start a marquee
    // selection box, tracking the drag with window-level listeners.
    const handleContainerMouseDown = (event) => {
        if (event.button !== 0) return;
        if (event.target.closest('button, a, input, label, [data-file-item]')) return;
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const startX = event.clientX - containerRect.left;
        const startY = event.clientY - containerRect.top;
        const additive = event.shiftKey || event.ctrlKey || event.metaKey;
        const baseSelection = additive ? new Set(selectedIds) : new Set();

        if (!additive) setSelectedIds(new Set());
        setDragBox({ x: startX, y: startY, w: 0, h: 0 });

        const handleMouseMove = (moveEvent) => {
            const rect = containerRef.current.getBoundingClientRect();
            const currentX = moveEvent.clientX - rect.left;
            const currentY = moveEvent.clientY - rect.top;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            setDragBox({ x: left, y: top, w: width, h: height });

            const selRect = { left, top, right: left + width, bottom: top + height };
            const next = new Set(baseSelection);
            itemRefs.current.forEach((node, id) => {
                const itemRect = node.getBoundingClientRect();
                const relative = {
                    left: itemRect.left - rect.left,
                    top: itemRect.top - rect.top,
                    right: itemRect.right - rect.left,
                    bottom: itemRect.bottom - rect.top,
                };
                const intersects =
                    selRect.left < relative.right &&
                    selRect.right > relative.left &&
                    selRect.top < relative.bottom &&
                    selRect.bottom > relative.top;
                if (intersects) next.add(id);
            });
            setSelectedIds(next);
        };

        const handleMouseUp = () => {
            setDragBox(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    //handle single file deletion
    const handleDelete = (file) => {
        setDeleteTarget({ type: 'single', file });
    };

    //handle bulk deletion of every currently selected file
    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        setDeleteTarget({ type: 'bulk', ids: Array.from(selectedIds) });
    };

    const confirmDelete = async () => {
        if (!token || !deleteTarget) return;

        if (deleteTarget.type === 'single') {
            const { file } = deleteTarget;
            try {
                await axios.delete(apiEndpoints.DELETE_FILE(file.id), { headers: { Authorization: `Bearer ${token}` } });
                setFiles((prev) => prev.filter((f) => f.id !== file.id));
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(file.id);
                    return next;
                });
                toast.success(t('myFiles.deleteSuccess'));
            } catch (error) {
                console.error('Error deleting file', error);
                toast.error(t('myFiles.deleteError', { error: error.message }));
            }
        } else {
            const { ids } = deleteTarget;
            const results = await Promise.allSettled(
                ids.map((id) => axios.delete(apiEndpoints.DELETE_FILE(id), { headers: { Authorization: `Bearer ${token}` } }))
            );
            const deletedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
            const failedCount = ids.length - deletedIds.length;

            setFiles((prev) => prev.filter((f) => !deletedIds.includes(f.id)));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                deletedIds.forEach((id) => next.delete(id));
                return next;
            });

            if (failedCount > 0) {
                console.error(`Failed to delete ${failedCount} file(s)`);
                toast.error(t('myFiles.bulkDeleteError'));
            }
            if (deletedIds.length > 0) {
                toast.success(t('myFiles.bulkDeleteSuccess', { count: deletedIds.length }));
            }
        }

        setDeleteTarget(null);
    };

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return (
        <DashboardLayout activeMenu="myFiles">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('myFiles.title', { count: files.length })}</h2>
                    <div className="flex items-center gap-3">
                        <List
                            onClick={() => setViewMode('list')}
                            size={24}
                            className={`cursor-pointer transition-colors ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        />
                        <Grid
                            onClick={() => setViewMode('grid')}
                            size={24}
                            className={`cursor-pointer transition-colors ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        />
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            {t('myFiles.selectAll')}
                        </label>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                    {t('myFiles.selectedCount', { count: selectedIds.size })}
                                </span>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    {t('myFiles.clearSelection')}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                                >
                                    <Trash2 size={16} />
                                    {t('myFiles.deleteSelected')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {files.length === 0 ? (
                    // Empty State
                    <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center">
                        <File size={60} className="text-purple-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">{t('myFiles.emptyTitle')}</h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">{t('myFiles.emptyHint')}</p>
                        <button
                            onClick={() => navigate('/upload')}
                            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                        >
                            {t('myFiles.goToUpload')}
                        </button>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        onMouseDown={handleContainerMouseDown}
                        className={`relative ${dragBox ? 'select-none' : ''}`}
                    >
                        {dragBox && (dragBox.w > 2 || dragBox.h > 2) && (
                            <div
                                className="pointer-events-none absolute z-10 rounded-sm border border-purple-400 bg-purple-400/10"
                                style={{ left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h }}
                            />
                        )}

                        {viewMode === 'list' ? (
                            // List View (Table Structure)
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="w-10 px-6 py-3"></th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('myFiles.name')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('myFiles.size')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('myFiles.date')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('myFiles.visibility')}
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('myFiles.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {files.map((file, index) => (
                                            <tr
                                                key={file.id}
                                                ref={setItemRef(file.id)}
                                                data-file-item="true"
                                                onMouseDown={(e) => handleItemMouseDown(e, file, index)}
                                                className={`cursor-default select-none transition-colors ${selectedIds.has(file.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Select */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(file.id)}
                                                        onChange={() => toggleSelect(file.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                </td>
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
                                                            className="flex items-center gap-2 cursor-pointer group"
                                                        >
                                                            {file.isPublic ? (
                                                                <>
                                                                    <Globe size={16} className="text-green-500" />
                                                                    <span className="group-hover:underline">
                                                                        {t('myFiles.public')}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock size={16} className="text-gray-500" />
                                                                    <span className="group-hover:underline">
                                                                        {t('myFiles.private')}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                        {file.isPublic && (
                                                            <button
                                                                onClick={() =>
                                                                    setShareModal({
                                                                        isOpen: true,
                                                                        link: `${window.location.origin}/file/${file.id}`,
                                                                    })
                                                                }
                                                                className="flex items-center gap-2 cursor-pointer group text-blue-600"
                                                            >
                                                                <Copy size={16} />
                                                                <span className="group-hover:underline">{t('myFiles.share')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex justify-center gap-4">
                                                        <button
                                                            onClick={() => handlePreview(file)}
                                                            title={t('myFiles.preview')}
                                                            className="text-gray-500 hover:text-blue-600"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(file)}
                                                            title={t('myFiles.download')}
                                                            className="text-gray-500 hover:text-blue-600"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(file)}
                                                            title={t('myFiles.delete')}
                                                            className="text-gray-500 hover:text-red-600"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        {file.isPublic ? (
                                                            <a
                                                                href={`/file/${file.id}`}
                                                                title={t('myFiles.openPublicPage')}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-gray-500 hover:text-blue-600"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </a>
                                                        ) : (
                                                            <span className="w-[18px]"></span>
                                                        )}
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
                                {files.map((file, index) => (
                                    <div
                                        key={file.id}
                                        ref={setItemRef(file.id)}
                                        data-file-item="true"
                                        onMouseDown={(e) => handleItemMouseDown(e, file, index)}
                                        className={`select-none bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col ${selectedIds.has(file.id) ? 'border-purple-400 ring-1 ring-purple-200' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(file.id)}
                                                    onChange={() => toggleSelect(file.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <File size={28} className="text-blue-600" />
                                            </div>
                                            <button onClick={() => togglePublic(file)} className="p-1 rounded hover:bg-gray-100">
                                                {file.isPublic ? (
                                                    <Globe size={16} className="text-green-500" />
                                                ) : (
                                                    <Lock size={16} className="text-gray-500" />
                                                )}
                                            </button>
                                        </div>
                                        <h4 className="font-medium text-gray-800 truncate mb-1" title={file.name}>
                                            {file.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-4">
                                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                                        </p>

                                        <div className="mt-auto flex justify-end gap-3 pt-3 border-t">
                                            {file.isPublic && (
                                                <button
                                                    onClick={() =>
                                                        setShareModal({
                                                            isOpen: true,
                                                            link: `${window.location.origin}/file/${file.id}`,
                                                        })
                                                    }
                                                    title={t('myFiles.share')}
                                                    className="text-gray-500 hover:text-blue-600"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handlePreview(file)}
                                                title={t('myFiles.preview')}
                                                className="text-gray-500 hover:text-blue-600"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(file)}
                                                title={t('myFiles.download')}
                                                className="text-gray-500 hover:text-blue-600"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file)}
                                                title={t('myFiles.delete')}
                                                className="text-gray-500 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title={t('myFiles.confirmDeleteTitle')}
                confirmText={
                    deleteTarget?.type === 'bulk'
                        ? t('myFiles.confirmBulkDeleteButton', { count: deleteTarget.ids.length })
                        : t('myFiles.confirmDeleteButton')
                }
                cancelText={t('common.cancel')}
                confirmButtonClass="bg-red-500 hover:bg-red-600 focus:ring-red-500" // Đổi nút Confirm thành màu đỏ cho đúng chuẩn UX cảnh báo
                onConfirm={confirmDelete}
            >
                <div className="text-gray-600">
                    {deleteTarget?.type === 'bulk'
                        ? t('myFiles.confirmBulkDeleteBody', { count: deleteTarget.ids.length })
                        : t('myFiles.confirmDeleteBody', { name: deleteTarget?.file?.name })}
                </div>
            </Modal>

            {/* Share Link Modal */}
            <LinkShareModal
                isOpen={shareModal.isOpen}
                onClose={() => setShareModal({ isOpen: false, link: '' })}
                link={shareModal.link}
                title={t('myFiles.shareModalTitle')}
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={preview.isOpen}
                file={preview.file}
                url={preview.url}
                kind={preview.kind}
                loading={preview.loading}
                error={preview.error}
                onClose={preview.close}
                onDownload={() => preview.file && handleDownload(preview.file)}
            />
        </DashboardLayout>
    );
};

export default MyFiles;
