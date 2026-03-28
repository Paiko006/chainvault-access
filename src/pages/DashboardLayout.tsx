import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      {/* Animated Subtle Grid mask */}
      <div className="absolute inset-0 grid-bg-animated opacity-40 z-0 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen bg-background/30 backdrop-blur-[2px]">
          <DashboardHeader />
          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
