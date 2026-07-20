import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import googleIcon from '../assets/google.svg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const [googleInit, setGoogleInit] = useState(false);
    const { login, loginWithGoogle, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Login failed. Please check your credentials.');
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
        });
        setGoogleInit(true);
    };

    const handleGoogleLogin = async () => {
        if (!googleClientId) {
            setError('Google client ID is not configured.');
            return;
        }
        if (!googleReady) {
            setError('Google login is still loading. Please wait a moment.');
            return;
        }
        initGoogle();
        window.google.accounts.id.prompt();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Sign in to Cloud Share</h1>
                    <p className="text-gray-500 mt-2">Welcome back! Please sign in to continue.</p>
                </div>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        <img src={googleIcon} alt="Google" className="h-5 w-5" />
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="block h-px flex-1 bg-gray-200"></span>
                        <span className="text-sm text-gray-500">or</span>
                        <span className="block h-px flex-1 bg-gray-200"></span>
                    </div>

                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email-page">Địa chỉ email</label>
                            <input
                                type="email" id="email-page" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password-page">Mật khẩu</label>
                            <input
                                type="password" id="password-page" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 font-semibold">
                            {loading ? <Loader2 className="animate-spin" /> : 'Tiếp tục'}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Chưa có tài khoản? <Link to="/register" className="font-semibold text-purple-600 hover:underline">Đăng ký</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;