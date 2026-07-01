import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import MyFiles from "./pages/MyFiles.jsx";
import Subscription from "./pages/Subscription.jsx";
import Transactions from "./pages/Transactions.jsx";
import {Toaster} from "react-hot-toast";
import {UserCreditsProvider} from "./context/UserCreditsContext.jsx";
import PublicFileView from "./pages/PublicFileView.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Login from "./pages/Login.jsx";
// Giả sử bạn có trang Register.jsx
// import Register from "./pages/Register.jsx";

const App = () => {
    return (
        <UserCreditsProvider>
            <BrowserRouter>
                <Toaster />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    {/* <Route path="/register" element={<Register />} /> */}
                    <Route path="/file/:fileId" element={<PublicFileView />} />

                    {/* Private Routes */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/my-files" element={<MyFiles />} />
                        <Route path="/subscriptions" element={<Subscription />} />
                        <Route path="/transactions" element={<Transactions />} />
                    </Route>

                    {/* Fallback route - có thể chuyển hướng về trang chủ */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </UserCreditsProvider>
    )
}

export default App;