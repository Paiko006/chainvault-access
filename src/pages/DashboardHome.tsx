import { FileText, HardDrive, Share2, Clock, ExternalLink, Upload, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAptBalance } from "@aptos-labs/react";
import { Link } from "react-router-dom";
import { shortenAddress } from "@/lib/wallet";
import { StoredBlob, getStoredBlobs, BLOBS_STORAGE_KEY } from "@/types/storage";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardHome() {
  const { connected, account, wallet } = useWallet();
  const { data: aptBalance, isLoading: balanceLoading } = useAptBalance();

  const blobs = getStoredBlobs().filter(
    (b) => !account || b.ownerAddress === account.address.toString()
  );

  const totalSize = blobs.reduce((s, b) => s + b.sizeBytes, 0);
  const lastUpload = blobs[0] ? timeAgo(blobs[0].uploadedAt) : "—";

  const aptDisplay = balanceLoading
    ? "…"
    : aptBalance != null
    ? `${Number(aptBalance) / 1e8} APT`
    : "—";

  const stats = [
    {
      label: "Total Files",
      value: String(blobs.length),
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Storage Used",
      value: formatBytes(totalSize),
      icon: HardDrive,
      color: "text-accent",
    },
    {
      label: "APT Balance",
      value: aptDisplay,
      icon: Share2,
      color: "text-primary",
    },
    {
      label: "Last Upload",
      value: lastUpload,
      icon: Clock,
      color: "text-accent",
    },
  ];

  if (!connected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your decentralized file vault.
          </p>
        </div>
        <div className="glass-card p-12 text-center rounded-xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <PlugZap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Connect your wallet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Connect an Aptos wallet to view your vault stats and uploaded files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with address + network badge */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your decentralized file vault.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Aptos Testnet
          </span>
          {account && (
            <div className="flex flex-col items-end gap-1">
              <a
                href={`https://explorer.shelby.xyz/testnet/account/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline transition-all"
              >
                Shelby Explorer
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a
                href={`https://explorer.aptoslabs.com/account/${account.address}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {shortenAddress(account.address.toString())}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card p-5 hover:glow-sm transition-all duration-300"
          >
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className="text-3xl font-bold mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent files table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold">Recent Files</h2>
          <Link to="/dashboard/upload">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Upload className="h-3 w-3" />
              Upload
            </Button>
          </Link>
        </div>

        {blobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No files yet.</p>
            <Link to="/dashboard/upload">
              <Button variant="hero" size="sm" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                Upload your first file
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">File Name</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                    Size
                  </th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                    Uploaded
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {blobs.map((b, idx) => {
                  const expired = Date.now() * 1000 > b.expirationMicros;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground truncate max-w-[180px]">
                        {b.blobName}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        {formatBytes(b.sizeBytes)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        {timeAgo(b.uploadedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            expired
                              ? "bg-muted text-muted-foreground"
                              : "bg-accent/10 text-accent"
                          }`}
                        >
                          {expired ? "Expired" : "Permanent"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
