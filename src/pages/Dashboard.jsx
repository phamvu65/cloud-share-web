import { useAuth, UserButton } from "@clerk/clerk-react";
import DashboardLayout from "../layout/DashBoardLayout";
import { useEffect } from "react";

const Dashboard = () => {
  const { getToken } = useAuth();
  useEffect(() => {
    const displayToken = async () => {
      const token = await getToken();
      console.log("User token:", token);
      // Use the token to make authenticated requests to your backend
    };
    displayToken();
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;