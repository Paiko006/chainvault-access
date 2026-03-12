import { FileText, HardDrive, Share2, Clock, Eye, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Files", value: "142", icon: FileText, color: "text-primary" },
  { label: "Storage Used", value: "2.4 GB", icon: HardDrive, color: "text-accent" },
  { label: "Files Shared", value: "38", icon: Share2, color: "text-primary" },
  { label: "Last Upload", value: "2m ago", icon: Clock, color: "text-accent" },
];

const files = [
  { name: "report-q4.pdf", id: "SHB-12345", owner: "0x7a3B...f29D", date: "Mar 10, 2026", status: "Active" },
  { name: "wallet-backup.enc", id: "SHB-12346", owner: "0x7a3B...f29D", date: "Mar 9, 2026", status: "Active" },
  { name: "contract-v2.sol", id: "SHB-12347", owner: "0x7a3B...f29D", date: "Mar 8, 2026", status: "Restricted" },
  { name: "team-keys.json", id: "SHB-12348", owner: "0x7a3B...f29D", date: "Mar 7, 2026", status: "Active" },
  { name: "nft-metadata.json", id: "SHB-12349", owner: "0x7a3B...f29D", date: "Mar 6, 2026", status: "Expired" },
];

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your decentralized file vault.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5 hover:glow-sm transition-all duration-300">
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className="text-3xl font-bold mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold">Recent Files</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">File Name</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Storage ID</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Owner</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Upload Date</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">{f.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground hidden md:table-cell">{f.id}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground hidden lg:table-cell">{f.owner}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{f.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      f.status === "Active" ? "bg-accent/10 text-accent" :
                      f.status === "Restricted" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Link2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
