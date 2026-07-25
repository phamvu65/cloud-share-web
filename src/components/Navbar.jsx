import {useContext, useEffect, useRef, useState} from "react";
import {Menu, Share2, X, LogOut, User} from "lucide-react";
import {Link} from "react-router-dom";
import SideMenu from "./SideMenu.jsx";
import CreditsDisplay from "./CreditsDisplay.jsx";
import AuthModal from "./AuthModal.jsx";
import AccountModal from "./AccountModal.jsx";
import { UserCreditsContext } from "../context/UserCreditsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = ({activeMenu}) => {
    const [openSideMenu, setOpenSideMenu] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('signin');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const dropdownRef = useRef(null);
    const {credits,fetchUserCredits} = useContext(UserCreditsContext);
    const { isAuthenticated, logout, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserCredits();
        }
    }, [isAuthenticated, fetchUserCredits]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex items-center justify-between gap-5 bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-4 sm:px-7 sticky top-0 z-30">
            {/* Left side - menu button and title*/}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => setOpenSideMenu(!openSideMenu)}
                    className="block lg:hidden text-black hover:bg-gray-100 p-1 rounded transition-colors">
                    {openSideMenu ? (
                        <X className="text-2xl" />
                    ): (
                        <Menu className="text-2xl" />
                    )}
                </button>

                <div className="flex items-center gap-2">
                    <Share2 className="text-blue-600" />
                    <span className="text-lg font-medium text-black truncate">
                        Cloud Share
                    </span>
                </div>
            </div>

            {/* Right side - Authenticated View */}
            {isAuthenticated && (
                <div className="flex items-center gap-4">
                    <Link to="/subscriptions">
                        <CreditsDisplay credits={credits} />
                    </Link>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.displayName || user.email || 'User avatar'}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                    <User className="h-4 w-4" />
                                </div>
                            )}
                            <span className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-72 rounded-[28px] border border-gray-200 bg-white p-4 shadow-2xl">
                                <div className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.displayName || user.email || 'User avatar'}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                            <User className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
                                        <p className="mt-1 text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            setIsAccountModalOpen(true);
                                        }}
                                    >
                                        <User className="h-4 w-4" />
                                        Manage account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-gray-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Right side - Unauthenticated View */}
            {!isAuthenticated && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setAuthMode('signin');
                            setIsAuthModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => {
                            setAuthMode('signup');
                            setIsAuthModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                        Đăng ký
                    </button>
                </div>
            )}

            {/* Mobile side menu */}
            {openSideMenu && (
                <div className="fixed top-18.25 left-0 right-0 bg-white border-b border-gray-200 lg:hidden z-20">
                    {/* Side menu bar */}
                    <SideMenu activeMenu={activeMenu}/>
                </div>
            )}

            {/* Authentication Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                initialMode={authMode}
                onClose={() => setIsAuthModalOpen(false)}
            />
            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
            />
        </div>
    )
}

export default Navbar;