import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";
import FloatingDocChat from "../FloatingDocChat";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <FloatingDocChat />
    </div>
  );
};

export default DashboardLayout;
