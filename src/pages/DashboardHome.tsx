import { useState, useEffect } from "react";
import { FileText, HardDrive, Share2, Clock, ExternalLink, Upload, PlugZap, Loader2, RefreshCw, Key, ShieldCheck, Copy, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAptBalance } from "@aptos-labs/react";
import { Link } from "react-router-dom";
import { shortenAddress } from "@/lib/wallet";
import { fetchAccountBlobs, ShelbyBlob, formatBytes, fromShelbyTimestamp } from "@/lib/shelby-indexer";

export default function DashboardHome() {
  const { connected, account } = useWallet();
  const { data: aptBalance, isLoading: balanceLoading } = useAptBalance();
  const [blobs, setBlobs] = useState<ShelbyBlob[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [vaultSeed, setVaultSeed] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      const seed = localStorage.getItem(`vault_seed_${account.address}`);
      setVaultSeed(seed);
    }
  }, [account]);

  useEffect(() => {
    async function loadData() {
      if (connected && account) {
        setLoading(true);
        try {
          const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
          const data = await fetchAccountBlobs(account.address.toString(), apiKey);
          setBlobs(data);
          setLastSync(new Date());
        } catch (err) {
          console.error("Failed to sync blobs:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [connected, account]);

  const totalSize = blobs.reduce((s, b) => s + Number(b.size), 0);
  const lastUpload = blobs[0] ? fromShelbyTimestamp(blobs[0].created_at).toLocaleDateString() : "—";

  const aptDisplay = balanceLoading
    ? "…"
    : aptBalance != null
    ? `${Number(aptBalance) / 1e8} APT`
    : "—";

  const stats = [
    {
      label: "Total Assets",
      value: loading ? "..." : String(blobs.length),
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Capacity Used",
      value: loading ? "..." : formatBytes(totalSize),
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
      label: "Last Activity",
      value: lastUpload,
      icon: Clock,
      color: "text-accent",
    },
  ];

  if (!connected) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Overview of your decentralized file vault.
            </p>
          </div>
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
      {/* Header with address + sync status */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">
            Live decentralized storage status from Shelby Explorer.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold text-primary uppercase animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing Network...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-[10px] font-bold text-green-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Synced
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-[10px] font-bold text-accent uppercase">
              Aptos Testnet
            </span>
          </div>
          {account && (
            <div className="flex flex-col items-end gap-1">
              <a
                href={`https://explorer.shelby.xyz/testnet/account/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline font-bold"
              >
                View on Shelby Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
              <div className="text-[10px] text-muted-foreground font-mono">
                {shortenAddress(account.address.toString())}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card p-5 hover:glow-sm transition-all duration-300 border-l-2 border-l-transparent hover:border-l-primary"
          >
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className="text-3xl font-bold mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Security & Vault Key */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-accent relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <ShieldCheck className="h-24 w-24 text-accent" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-accent" />
                Security & Vault Key
              </h2>
              <span className="bg-accent/10 text-accent text-[9px] font-black px-2 py-0.5 rounded-full border border-accent/20 uppercase tracking-tighter">
                Highly Confidential
              </span>
            </div>
            <p className="text-muted-foreground text-xs max-w-lg leading-relaxed">
              This is your unique **Decryption Seed**. Share this key **ONLY** with people you want to grant full reading access to your encrypted vault files.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[300px]">
             <div className="relative group/key">
              <div className={`p-4 pr-24 rounded-xl bg-secondary/50 border border-border/50 font-mono text-[11px] break-all transition-all duration-500 ${!showKey ? 'blur-md select-none opacity-50' : 'bg-secondary/80 shadow-inner'}`}>
                {vaultSeed || "Seed not found. Upload a file first."}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-all active:scale-90"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? "Hide Secret" : "Reveal Secret"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                  onClick={() => {
                    if (vaultSeed) {
                      navigator.clipboard.writeText(vaultSeed);
                      toast.success("Vault Key copied to clipboard! 📋");
                    }
                  }}
                  title="Copy to Clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-accent/80 font-bold uppercase tracking-widest">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              Stored locally on your device only.
            </div>
          </div>
        </div>
      </div>

      {/* Recent files table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <h2 className="font-semibold">Recent Assets</h2>
             {lastSync && (
               <span className="text-[10px] text-muted-foreground italic">
                 Last Sync: {lastSync.toLocaleTimeString()}
               </span>
             )}
          </div>
          <Link to="/dashboard/upload">
            <Button variant="hero" size="sm" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              Upload New
            </Button>
          </Link>
        </div>

        {blobs.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No assets found for this account.</p>
            <Link to="/dashboard/upload">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                Start Securing Files
              </Button>
            </Link>
          </div>
        ) : loading && blobs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <Loader2 className="h-8 w-8 text-primary animate-spin" />
             <p className="text-xs text-muted-foreground animate-pulse uppercase tracking-widest font-bold">Fetching from Indexer...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Asset Name</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell uppercase text-[10px]">
                    Capacity
                  </th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell uppercase text-[10px]">
                    Created At
                  </th>
                  <th className="text-right px-5 py-3 font-medium uppercase text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blobs.slice(0, 10).map((b, idx) => {
                  const cleanName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground truncate max-w-[200px]">
                        <div className="flex items-center gap-2">
                           <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                           </div>
                           {cleanName}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        {formatBytes(b.size)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        {fromShelbyTimestamp(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={`https://explorer.shelby.xyz/testnet/blobs/${b.owner}?blobName=${encodeURIComponent(cleanName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                               <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </a>
                        </div>
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
