import { useEffect, useState } from 'react';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import googleIcon from '../assets/google.svg';

const AuthModal = ({ isOpen, initialMode = 'signin', onClose }) => {
    const [mode, setMode] = useState(initialMode);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const [googleInit, setGoogleInit] = useState(false);
    const { login, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        if (!isOpen) {
            setFirstName('');
            setLastName('');
            setUsername('');
            setIdentifier('');
            setPassword('');
            setShowPassword(false);
            setError('');
            setSuccessMessage('');
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!googleClientId) return;

        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            if (window.google?.accounts?.id) {
                setGoogleReady(true);
            } else {
                existingScript.addEventListener('load', () => setGoogleReady(true));
            }
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleReady(true);
        script.onerror = () => setError('Google login failed to load.');
        document.body.appendChild(script);
    }, [googleClientId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                await login(identifier, password);
                onClose();
                navigate('/dashboard');
            } else {
                await register(firstName, lastName, identifier, password, username);
                setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.');
                setMode('signin');
                setPassword('');
            }
        } catch (err) {
            setError(
                mode === 'signin'
                    ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
                    : 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleResponse = async (response) => {
        if (!response?.credential) {
            setError('Google login failed. Please try again.');
            return;
        }

        setLoading(true);
        try {
            await loginWithGoogle(response.credential);
            onClose();
            navigate('/dashboard');
        } catch (err) {
            setError('Google login failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initGoogle = () => {
        if (!googleReady || googleInit || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            ux_mode: 'popup',
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: false,
        });
        setGoogleInit(true);
    };

    const handleGoogle = async () => {
        if (!googleClientId) {
            setError('Google client ID is not configured.');
            return;
        }

        if (!googleReady) {
            setError('Google login is still loading. Please wait a moment.');
            return;
        }

        initGoogle();
        try {
            window.google.accounts.id.prompt((notification) => {
                if (notification?.isNotDisplayed?.()) {
                    const reason = notification.getNotDisplayedReason?.();
                    const friendlyMessage = reason === 'suppressed_by_user'
                        ? 'Google sign-in was blocked by the browser. Please allow third-party sign-in and try again.'
                        : 'Google sign-in is currently unavailable in this browser.';
                    setError(friendlyMessage);
                } else if (notification?.isSkippedMoment?.()) {
                    const reason = notification.getSkippedReason?.();
                    const friendlyMessage = reason === 'user_cancel'
                        ? 'Google sign-in was canceled.'
                        : 'Google sign-in was skipped. Please try again.';
                    setError(friendlyMessage);
                }
            });
        } catch (err) {
            setError('Google sign-in is currently unavailable. Please try another browser or enable third-party sign-in.');
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                    <X size={20} />
                </button>

                <div className="grid gap-8 p-8 sm:p-10">
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-purple-600">Cloud Share</p>
                            <h2 className="mt-3 text-3xl font-semibold text-gray-900">
                                {mode === 'signin' ? 'Sign in to Cloud Share' : 'Create your account'}
                            </h2>
                            <p className="mt-3 text-gray-500">
                                {mode === 'signin'
                                    ? 'Welcome back! Please sign in to continue.'
                                    : 'Create an account to start sharing files securely.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={!googleClientId || !googleReady}
                            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <img src={googleIcon} alt="Google" className="h-5 w-5" />
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="block h-px flex-1 bg-gray-200" />
                            <span>or</span>
                            <span className="block h-px flex-1 bg-gray-200" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                                        <input
                                            id="first-name"
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                            placeholder="First name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                                        <input
                                            id="last-name"
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                            placeholder="Last name"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {mode === 'signup' && (
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username <span className="text-gray-400">(Optional)</span></label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        placeholder="Your username"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">Email or username</label>
                                <input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    placeholder="Email or username"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-gray-700 "
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'signin' ? 'Continue' : 'Create account'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500">
                            {mode === 'signin' ? (
                                <>
                                    Don’t have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('signup')}
                                        className="font-semibold text-purple-600 hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('signin')}
                                        className="font-semibold text-purple-600 hover:underline"
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthModal;
