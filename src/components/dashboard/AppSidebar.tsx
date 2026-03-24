import { SidebarContent } from "./SidebarContent";

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar shrink-0 h-screen sticky top-0 transition-all duration-300">
      <SidebarContent />
    </aside>
  );
}
