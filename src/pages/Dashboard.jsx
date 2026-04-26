import { UserButton } from "@clerk/clerk-react";
import DashboardLayout from "../layout/DashBoardLayout";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div>
        <UserButton> </UserButton>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;