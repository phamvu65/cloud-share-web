import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

const LoginModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            onClose(); // Close modal on successful login
            navigate('/dashboard'); // Navigate to dashboard
        } catch (err) {
            setError('Login failed. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Sign in to Cloud Share</h1>
                    <p className="text-gray-500 mt-2">Welcome back! Please sign in to continue.</p>
                </div>

                <div className="space-y-4">
                    {/* Social login buttons can be added here */}
                    {/* <div className="cl-dividerRow">...</div> */}

                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email-modal">
                                Email address
                            </label>
                            <input
                                type="email" id="email-modal" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password-modal">
                                Password
                            </label>
                            <input
                                type="password" id="password-modal" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 font-semibold tracking-wide">
                            {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-purple-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;