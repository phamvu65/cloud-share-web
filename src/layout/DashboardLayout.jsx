import Navbar from "../components/Navbar.jsx";
import SideMenu from "../components/SideMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DashboardLayout = ({children, activeMenu}) => {
    const { user, isAuthenticated } = useAuth();
    return (
        <div>
            {/* Navbar component goes here*/}
            <Navbar activeMenu={activeMenu}/>
            <div className="flex">
                {isAuthenticated && user && (
                    <div className="max-[1080px]:hidden">
                        {/* Sidemenu goes here - only relevant once there's an account to manage */}
                        <SideMenu activeMenu={activeMenu}/>
                    </div>
                )}
                <div className="grow mx-5">{children}</div>
            </div>
        </div>
    )
}

export default DashboardLayout;