import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Share2,
  ShieldCheck,
  Settings,
  Lock,
  Compass,
} from "lucide-react";

const nav = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "My Files", to: "/dashboard/files", icon: FileText },
  { title: "Upload", to: "/dashboard/upload", icon: Upload },
  { title: "Shared Files", to: "/dashboard/shared", icon: Share2 },
  { title: "Access Control", to: "/dashboard/access", icon: ShieldCheck },
  { title: "Settings", to: "/dashboard/settings", icon: Settings },
  { title: "Network Explorer", to: "/dashboard/explorer", icon: Compass },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar shrink-0 h-screen sticky top-0">
      <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Lock className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg text-sidebar-accent-foreground">ChainLocker</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="glass-card px-3 py-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Storage Used</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-3/5 bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">2.4 GB / 5 GB</div>
        </div>
      </div>
    </aside>
  );
}
