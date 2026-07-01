import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader2 } from "lucide-react";

const PrivateRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Nếu chưa đăng nhập, chuyển hướng về trang /login
        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, hiển thị component con (Dashboard, MyFiles,...)
    return <Outlet />;
};

export default PrivateRoute;