import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiEndpoints } from '../util/apiEndpoints.js';
import googleIcon from '../assets/google.svg';

const AccountModal = ({ isOpen, onClose }) => {
    const { user, updateProfile, setPassword: setUserPassword, deleteAccount } = useAuth();
    const modalRef = useRef(null);
    const [activeSection, setActiveSection] = useState('profile');
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [photoUrl, setPhotoUrl] = useState(user?.avatar || '');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    const [loading, setLoading] = useState(false);
    const [securityLoading, setSecurityLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFirstName(user?.firstName || '');
            setLastName(user?.lastName || '');
            setUsername(user?.username || '');
            setAvatarPreview(user?.avatar || '');
            setPhotoUrl(user?.avatar || '');
            setSuccessMessage('');
            setErrorMessage('');
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (!isOpen) return;

        const loadSessions = async () => {
            try {
                setSessionsLoading(true);
                const response = await axios.get(apiEndpoints.LIST_SESSIONS, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
                setSessions(response.data || []);
            } catch (error) {
                console.error('Failed to load sessions:', error);
            } finally {
                setSessionsLoading(false);
            }
        };

        if (activeSection === 'security') {
            loadSessions();
        }
    }, [isOpen, activeSection]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                setAvatarPreview(result);
                setPhotoUrl(result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdate = async () => {
        setSuccessMessage('');
        setErrorMessage('');
        setLoading(true);

        try {
            await updateProfile({ firstName, lastName, username, photoUrl });
            setSuccessMessage('Account updated successfully.');
        } catch (error) {
            setErrorMessage('Could not update your profile. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        setSuccessMessage('');
        setErrorMessage('');

        if (!passwordInput || passwordInput.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }

        if (passwordInput !== confirmPasswordInput) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setSecurityLoading(true);

        try {
            await setUserPassword(passwordInput);
            setSuccessMessage('Password updated successfully.');
            setPasswordInput('');
            setConfirmPasswordInput('');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not update your password.');
            console.error(error);
        } finally {
            setSecurityLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('This will permanently delete your account. Continue?');
        if (!confirmed) return;

        setSuccessMessage('');
        setErrorMessage('');
        setSecurityLoading(true);

        try {
            await deleteAccount();
            onClose();
        } catch (error) {
            setErrorMessage('Could not delete your account. Please try again.');
            console.error(error);
        } finally {
            setSecurityLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            await axios.delete(apiEndpoints.REVOKE_SESSION(sessionId), {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            setSessions((prev) => prev.filter((session) => session.id !== sessionId));
        } catch (error) {
            console.error('Failed to revoke session:', error);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-black/30 backdrop-blur-sm px-4 pt-16 pb-10">
            <div ref={modalRef} className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-purple-600">Account</p>
                        <h2 className="text-2xl font-semibold text-gray-900">Profile details</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage your account info.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[220px_1fr] p-6">
                    <aside className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                        <div className="space-y-4">
                            <button
                            type="button"
                            onClick={() => setActiveSection('profile')}
                            className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
                                activeSection === 'profile'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                            }`}
                        >
                            <span className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 grid place-items-center">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                            Profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('security')}
                            className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
                                activeSection === 'security'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                            }`}
                        >
                            <span className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 grid place-items-center">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M1 12h22"/></svg>
                            </span>
                            Security
                        </button>
                        </div>
                    </aside>

                    <section className="rounded-3xl border border-gray-200 bg-white p-6">
                        {activeSection === 'profile' ? (
                            <>
                                <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:gap-6">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500">Avatar</p>
                                        <p className="mt-1 text-sm text-gray-500">Update your profile picture</p>
                                    </div>
                                    <div className="flex justify-center sm:justify-end">
                                        <label htmlFor="avatar-upload" className="relative cursor-pointer">
                                            <div className="h-16 w-16 overflow-hidden rounded-full bg-purple-100 text-purple-600 shadow-sm">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt={user?.displayName || 'Avatar'} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
                                                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={handleAvatarChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-center rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <label htmlFor="first-name" className="text-base font-semibold text-gray-700">First name</label>
                                        <input
                                            id="first-name"
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full rounded-3xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-center rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <label htmlFor="last-name" className="text-base font-semibold text-gray-700">Last name</label>
                                        <input
                                            id="last-name"
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full rounded-3xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-center rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <label htmlFor="username" className="text-base font-semibold text-gray-700">Username</label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full rounded-3xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-center rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <span className="text-base font-semibold text-gray-700">Email address</span>
                                        <p className="text-sm text-gray-900">{user?.email || 'No email'}</p>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                                        <span className="text-sm font-medium text-gray-600">Connected accounts</span>
                                        <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-3">
                                            <img src={googleIcon} alt="Google" className="h-5 w-5 rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Google</p>
                                                <p className="text-xs text-gray-500">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Password</p>
                                                <p className="mt-1 text-sm text-gray-500">Set a password for your account.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSetPassword}
                                                disabled={securityLoading}
                                                className="rounded-3xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                {securityLoading ? 'Saving…' : 'Set password'}
                                            </button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwordInput}
                                                    onChange={(e) => setPasswordInput(e.target.value)}
                                                    placeholder="New password"
                                                    className="w-full rounded-3xl border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={confirmPasswordInput}
                                                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                                    placeholder="Confirm password"
                                                    className="w-full rounded-3xl border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Active devices</p>
                                            <p className="mt-1 text-sm text-gray-500">Manage your signed-in sessions.</p>
                                        </div>
                                    </div>
                                    {sessionsLoading ? (
                                        <p className="mt-4 text-sm text-gray-500">Loading sessions…</p>
                                    ) : sessions.length === 0 ? (
                                        <p className="mt-4 text-sm text-gray-500">No active sessions found.</p>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {sessions.map((session) => (
                                                <div key={session.id} className="rounded-2xl border border-gray-200 bg-white p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {session.browser || 'Unknown browser'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {session.os || 'Unknown OS'} • {session.ipAddress || 'Unknown IP'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                Last used: {session.lastUsedAt ? new Date(session.lastUsedAt).toLocaleString() : '—'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {session.current && (
                                                                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                                                                    Current
                                                                </span>
                                                            )}
                                                            {!session.current && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRevokeSession(session.id)}
                                                                    className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Delete account</p>
                                            <p className="mt-1 text-sm text-gray-500">Permanently remove your account.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            disabled={securityLoading}
                                            className="rounded-3xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                        >
                                            {securityLoading ? 'Deleting…' : 'Delete account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'profile' ? (
                            <div className="pt-4 border-t border-gray-100">
                                {successMessage && <p className="mb-3 text-sm text-green-600">{successMessage}</p>}
                                {errorMessage && <p className="mb-3 text-sm text-red-600">{errorMessage}</p>}
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="w-full rounded-3xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {loading ? 'Updating…' : 'Update account'}
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-gray-100">
                                {successMessage && <p className="mb-3 text-sm text-green-600">{successMessage}</p>}
                                {errorMessage && <p className="mb-3 text-sm text-red-600">{errorMessage}</p>}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AccountModal;
