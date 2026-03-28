import { useState, useEffect } from "react";
import { 
  Share2, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Upload, 
  Search, 
  X, 
  Loader2, 
  Compass, 
  RefreshCw, 
  Download, 
  Lock,
  Users,
  Key,
  Shield,
  ShieldCheck,
  Clock,
  Database,
  Eye,
  HardDrive,
  Unlock,
  ShieldAlert
} from "lucide-react";
import { useDeleteBlobs } from "@shelby-protocol/react";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  fetchAccountBlobs, 
  ShelbyBlob, 
  formatBytes, 
  fromShelbyTimestamp, 
  fetchBlobData,
  fetchSharedBlobs,
  syncUserQuota 
} from "@/lib/shelby-indexer";
import { shortenAddress } from "@/lib/wallet";
import { getVaultKeys, getVaultKey, decryptData, decryptDataAsymmetric, ENCRYPTION_PREFIX, normalizeAptosAddress } from "@/lib/crypto";
import { useNotifications } from "@/hooks/use-notifications";
import { QUOTA_STORAGE_KEY, DEFAULT_QUOTA } from "@/components/landing/PricingSection";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FilesPage() {
  const { connected, account, signAndSubmitTransaction, signMessage } = useWallet();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [blobs, setBlobs] = useState<ShelbyBlob[]>([]);
  const [sharedBlobs, setSharedBlobs] = useState<ShelbyBlob[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [quota, setQuota] = useState(DEFAULT_QUOTA);

  useEffect(() => {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) setQuota(parseInt(stored));
  }, []);

  useEffect(() => {
    if (account) {
      const storageKey = `vault_seed_${normalizeAptosAddress(account.address.toString())}`;
      const seed = localStorage.getItem(storageKey);
      setIsVaultLocked(!seed);
    }
  }, [account]);

  const handleUnlockVault = async () => {
    if (!account || !signMessage) return;
    try {
      toast.loading("Unlocking Vault...", { id: "unlock-toast" });
      await getVaultKey(account.address.toString(), signMessage);
      setIsVaultLocked(false);
      toast.success("Vault Unlocked! You can now download and decrypt your files. 🔓", { id: "unlock-toast" });
    } catch (err: unknown) {
      toast.error("Unlock failed. Signature is required to access your private vault.", { id: "unlock-toast" });
    }
  };

  // Decryption Modal State (Removed - Asymmetric Encryption is now automatic)
  const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY;

  useEffect(() => {
    if (!connected || !account) return;
    
    const loadFiles = async () => {
      setLoading(true);
      try {
        const addr = account.address.toString();

        // 1. Cross-Device Sync: Check network for updated quota
        const networkQuota = await syncUserQuota(addr);
        if (networkQuota) {
          setQuota(networkQuota);
          localStorage.setItem(QUOTA_STORAGE_KEY, networkQuota.toString());
        }

        const userBlobs = await fetchAccountBlobs(addr, apiKey);
        setBlobs(userBlobs);

        const shared = await fetchSharedBlobs(addr, apiKey);
        setSharedBlobs(shared);
      } catch (err) {
        console.error("[ChainVault] Error fetching files:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [connected, account, refresh, apiKey]);

  const filtered = blobs.filter((b, index, self) => {
    // Get the base name without the @address/ prefix
    const rawName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
    
    // 1. Deduplicate by Name: Only show the first (newest) occurrence of each unique file name
    // This is the core logic that will make the count match Shelby Explorer's unique asset list.
    const isFirstOccurrence = self.findIndex(prev => {
      const prevRaw = prev.blob_name.includes('/') ? prev.blob_name.split('/').slice(1).join('/') : prev.blob_name;
      return prevRaw === rawName;
    }) === index;

    if (!isFirstOccurrence) return false;

    // Explorer shows all files including system files like .quota and .chainvault_pubkey
    // So we should NOT hide them, otherwise our count will be strictly less than Explorer.
    // if (rawName.startsWith('.')) return false;

    // 3. Basic text search filter
    if (search && !rawName.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const handleDownload = async (b: ShelbyBlob) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (isVaultLocked) {
      toast.error("Vault is locked on this device. Please click 'Unlock Vault' at the top of the list first.", {
        description: "Your personal signature is needed to decrypt your secure files.",
      });
      return;
    }

    setDownloadingId(b.blob_name);
    try {
      // Indexer returns "@address/suffix". Strip prefix for logic.
      const cleanName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
      
      // Support multiple common encryption prefixes for cross-app compatibility
      const isEncrypted = cleanName.startsWith(ENCRYPTION_PREFIX) || 
                          cleanName.startsWith("ENC-v1-") ||
                          cleanName.startsWith("ENC:v1:") || 
                          cleanName.toLowerCase().endsWith(".vault") ||
                          cleanName.includes("shelbysecure/");
      
      toast.loading(isEncrypted ? "Decrypting from Vault..." : "Downloading from Shelby...", { id: "dl-toast" });

      // 1. Fetch raw data from Shelby (fetchBlobData handles its own prefix stripping for the URL)
      const rawBlob = await fetchBlobData(b.blob_name, b.owner);
      
      let finalBlob = rawBlob;

      // 2. Decrypt if needed
      if (isEncrypted) {
        const keys = await getVaultKeys(account.address.toString(), signMessage);
        try {
          // Attempt Asymmetric Decryption first (New Standard)
          finalBlob = await decryptDataAsymmetric(rawBlob, account.address.toString(), keys);
          toast.success("File decrypted securely! 🔓", { id: "dl-toast" });
        } catch (err: any) {
          // Fallback to legacy Master Key (Backward Compatibility)
          try {
            // Some apps like SoobinVault use keys derived from the master key
            finalBlob = await decryptData(rawBlob, keys.aesKey);
            toast.success("File decrypted via master vault! 🔓", { id: "dl-toast" });
          } catch (fallbackErr) {
            console.warn("Asymmetric & Legacy Decryption failed for:", cleanName);
            throw new Error("Decryption failed. This file might be from another app or encrypted with a different key.");
          }
        }
      } else {
        toast.success("Download complete!", { id: "dl-toast" });
      }

      // 3. Trigger Download
      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      // Clean filename for user: remove both prefix and .vault extension
      const fileNameForUser = cleanName
        .replace(ENCRYPTION_PREFIX, "")
        .replace("ENC-v1-", "")
        .replace("ENC:v1:", "")
        .replace(/\.vault$/i, "");
      a.download = fileNameForUser;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err: unknown) {
      console.error("[ChainVault] Download/Decrypt error:", err);
      const errorMsg = err instanceof Error ? err.message : "Check your vault key or internet connection.";
      toast.error(`Error: ${errorMsg}`, { id: "dl-toast" });
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteBlobs = useDeleteBlobs({
    onSuccess: () => {
      toast.success("Asset deleted from Shelby network! 🗑️");
      addNotification({
        title: "File Deleted",
        description: "An asset has been permanently removed from your vault.",
        type: "warning"
      });
      setRefresh((r) => r + 1);
    },
    onError: (err: unknown) => {
      console.error("[ChainVault] Delete error:", err);
      toast.error("Failed to delete from Shelby: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  });

  const handleDelete = async (idx: number) => {
    if (!connected || !account || !signAndSubmitTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    const blobToDelete = filtered[idx];
    if (!blobToDelete) return;

    try {
      // SDK expects the raw blob name without the "@address/" prefix
      const cleanName = blobToDelete.blob_name.includes('/') 
        ? blobToDelete.blob_name.split('/').slice(1).join('/') 
        : blobToDelete.blob_name;

      await deleteBlobs.mutateAsync({
        blobNames: [cleanName],
        signer: {
          account: account.address.toString(),
          signAndSubmitTransaction,
        },
        options: {
          maxGasAmount: 100000,
        },
      });
    } catch (error) {
       // Handled by onError hook
    }
  };

  const totalSize = blobs.reduce((s, b) => s + Number(b.size), 0);
  const quotaBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  
  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Files</h1>
          <p className="text-muted-foreground text-sm">
            All files stored in your vault.
          </p>
        </div>
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground">
            Connect your wallet to view your files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Files</h1>
          <p className="text-muted-foreground text-sm">
            All files stored in your vault on{" "}
            <span className="font-medium text-primary">Shelby testnet</span>.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-2">
             {account && (
               <a
                 href={`https://explorer.shelby.xyz/testnet/account/${account.address}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary hover:underline font-bold"
               >
                 View Profile on Explorer
                 <ExternalLink className="h-3.5 w-3.5" />
               </a>
             )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRefresh(r => r + 1)}
                disabled={loading}
                className="gap-2 h-8 rounded-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Link to="/dashboard/upload">
                <Button variant="hero" size="sm" className="gap-2 h-8 rounded-lg px-4">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
              </Link>
           </div>
           {account && (
             <div className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
               {shortenAddress(account.address.toString())}
             </div>
           )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border-primary/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">My Assets</p>
            <p className="text-xl font-bold">{blobs.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-accent/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-accent/5 flex items-center justify-center text-accent">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Capacity Used</p>
            <p className="text-xl font-bold">
               {loading ? '...' : formatBytes(totalSize)}
               <span className="text-[10px] text-muted-foreground ml-1.5 font-normal tracking-tight">/ {formatBytes(quota)}</span>
            </p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-accent/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-accent/5 flex items-center justify-center text-accent">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Shared</p>
            <p className="text-xl font-bold">{sharedBlobs.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border-primary/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Last Activity</p>
            <p className="text-xl font-bold">
               {blobs[0] ? fromShelbyTimestamp(blobs[0].created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      {(blobs.length > 0 || sharedBlobs.length > 0 || search) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-9 bg-secondary/30 border-border/50 h-11 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      <Tabs defaultValue="my-vault" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 bg-muted/30 rounded-xl p-1 mb-6">
          <TabsTrigger value="my-vault" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            My Private Vault
          </TabsTrigger>
          <TabsTrigger value="shared" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Shared with Me
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-vault" className="space-y-4">
          {isVaultLocked && connected && blobs.length > 0 && (
            <div className="glass-card bg-accent/5 border-accent/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Vault is Protected</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your decryption key is missing on this device. Sign to initialize access.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUnlockVault}
                className="border-accent/50 hover:bg-accent/10 hover:border-accent text-accent font-bold gap-2 shrink-0 h-10 px-4"
              >
                <Unlock className="h-3.5 w-3.5" />
                Unlock Vault
              </Button>
            </div>
          )}

          {loading && blobs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                Connecting to Shelby Indexer...
              </p>
            </div>
          ) : blobs.length === 0 ? (
            <div className="glass-card p-14 text-center rounded-xl space-y-4">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No files found on Shelby Explorer.</p>
            </div>
          ) : (
            <FileTable list={filtered} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {loading && sharedBlobs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                Searching Shared Index...
              </p>
            </div>
          ) : sharedBlobs.length === 0 ? (
            <div className="glass-card p-14 text-center rounded-xl border-dashed border-2 border-border/50">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <p className="text-muted-foreground text-sm">No shared assets discovered for your address.</p>
            </div>
          ) : (
            <FileTable 
              list={sharedBlobs.filter(b => b.blob_name.toLowerCase().includes(search.toLowerCase()))} 
              onDownload={handleDownload}
              isShared 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const FileTable = ({ 
  list, 
  onDownload, 
  onDelete, 
  isShared 
}: { 
  list: ShelbyBlob[], 
  onDownload: (b: ShelbyBlob) => void, 
  onDelete?: (idx: number) => void,
  isShared?: boolean
}) => {
  return (
    <div className="glass-card overflow-hidden rounded-2xl border-border/40">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground">
              <th className="text-left px-5 py-3 font-medium uppercase text-[10px] w-12">#</th>
              <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Asset Name</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell uppercase text-[10px]">Capacity</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell uppercase text-[10px]">Created At</th>
              <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Status</th>
              <th className="text-right px-5 py-3 font-medium uppercase text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b, idx) => {
              const rawName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
              const isShelbyShared = rawName.startsWith("shelbysecure/");
              const cleanName = isShelbyShared ? rawName.replace("shelbysecure/", "") : rawName; // Keep original rawName if not shelbysecure for further checks
              
              const isEncrypted = cleanName.startsWith(ENCRYPTION_PREFIX) || 
                                  cleanName.startsWith("ENC-v1-") ||
                                  cleanName.startsWith("ENC:v1:") || 
                                  cleanName.toLowerCase().endsWith(".vault");
              const displayName = isEncrypted 
                ? cleanName.replace(ENCRYPTION_PREFIX, "").replace("ENC-v1-", "").replace("ENC:v1:", "").replace(/\.vault$/i, "")
                : cleanName;

              return (
                <tr key={b.blob_name} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs tabular-nums opacity-60">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center relative border border-primary/5">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        {isEncrypted ? (
                          <div className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5 border-2 border-background shadow-lg">
                            <Lock className="h-2 w-2 text-white" />
                          </div>
                        ) : (
                          <div className="absolute -top-1 -right-1 bg-muted-foreground/30 rounded-full p-0.5 border-2 border-background shadow-lg">
                            <ExternalLink className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground truncate max-w-[180px]" title={cleanName}>
                            {displayName}
                          </span>
                          {isEncrypted && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 text-[8px] font-black uppercase tracking-tighter">
                              <ShieldCheck className="h-2 w-2" />
                              VERIFIED
                            </div>
                          )}
                        </div>
                        {isEncrypted ? (
                          <span className="text-[9px] text-accent font-black uppercase tracking-widest leading-none mt-0.5">
                            Encrypted Vault
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-0.5">
                            External Asset
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell font-mono">
                    {formatBytes(b.size)}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    {fromShelbyTimestamp(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isShared ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isShared ? 'bg-accent' : 'bg-primary'} animate-pulse`} />
                      {isShared ? 'SHARED' : 'PRIVATE'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-accent hover:bg-accent/10 rounded-xl transition-all" onClick={() => onDownload(b)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isShared && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl transition-all" onClick={() => onDelete?.(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <a href={`https://explorer.shelby.xyz/testnet/blobs/${b.owner}?blobName=${encodeURIComponent(rawName)}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-xl transition-all">
                          <ExternalLink className="h-4 w-4" />
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
    </div>
  );
};
