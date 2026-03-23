import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { fetchAccountBlobs, formatBytes } from "@/lib/shelby-indexer";
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
  const { account, connected } = useWallet();
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(false);
  const QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB

  useEffect(() => {
    async function loadCapacity() {
      if (connected && account) {
        setLoading(true);
        try {
          const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
          const blobs = await fetchAccountBlobs(account.address.toString(), apiKey);
          const total = blobs.reduce((sum, b) => sum + Number(b.size), 0);
          setUsedBytes(total);
        } catch (err) {
          console.error("[Sidebar] Failed to load capacity:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setUsedBytes(0);
      }
    }
    loadCapacity();
  }, [connected, account]);

  const percentage = Math.min((usedBytes / QUOTA) * 100, 100);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar shrink-0 h-screen sticky top-0">
      <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Lock className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg text-sidebar-accent-foreground">ShelbySecure</span>
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
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Capacity Used</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-[11px] font-bold text-muted-foreground mt-2 font-mono flex items-center justify-between">
            <span>{loading ? "..." : formatBytes(usedBytes)}</span>
            <span className="text-[9px] opacity-60">/ 5 GB</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
