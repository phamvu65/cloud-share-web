import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Đăng nhập vào Cloud Share</h1>
                    <p className="text-gray-500 mt-2">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
                </div>

                <div className="space-y-4">
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