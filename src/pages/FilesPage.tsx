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
  Eye
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
  fetchSharedBlobs 
} from "@/lib/shelby-indexer";
import { getVaultKey, decryptData, ENCRYPTION_PREFIX } from "@/lib/crypto";
import { useNotifications } from "@/hooks/use-notifications";
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
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [blobs, setBlobs] = useState<ShelbyBlob[]>([]);
  const [sharedBlobs, setSharedBlobs] = useState<ShelbyBlob[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Decryption Modal State for Shared Files
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [activeSharedBlob, setActiveSharedBlob] = useState<ShelbyBlob | null>(null);
  const [manualKey, setManualKey] = useState("");

  useEffect(() => {
    async function loadData() {
      if (connected && account) {
        setLoading(true);
        try {
          const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
          const [myFiles, sharedFiles] = await Promise.all([
            fetchAccountBlobs(account.address.toString(), apiKey),
            fetchSharedBlobs(account.address.toString(), apiKey)
          ]);
          setBlobs(myFiles);
          setSharedBlobs(sharedFiles);
        } catch (err) {
          console.error("Failed to fetch files:", err);
          toast.error("Failed to sync with Shelby network");
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [connected, account, refresh]);

  const filtered = blobs.filter((b) =>
    b.blob_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (b: ShelbyBlob) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    setDownloadingId(b.blob_name);
    try {
      // Indexer returns "@address/suffix". Strip prefix for logic.
      const cleanName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
      const isEncrypted = cleanName.startsWith(ENCRYPTION_PREFIX) || 
                          cleanName.startsWith("ENC:v1:") || 
                          cleanName.toLowerCase().endsWith(".vault");
      
      toast.loading(isEncrypted ? "Decrypting from Vault..." : "Downloading from Shelby...", { id: "dl-toast" });

      // 1. Fetch raw data from Shelby (fetchBlobData handles its own prefix stripping for the URL)
      const rawBlob = await fetchBlobData(b.blob_name, b.owner);
      
      let finalBlob = rawBlob;

      // 2. Decrypt if needed
      if (isEncrypted) {
        const key = await getVaultKey(account.address.toString());
        finalBlob = await decryptData(rawBlob, key);
        toast.success("File decrypted successfully! 🔓", { id: "dl-toast" });
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
        .replace("ENC:v1:", "")
        .replace(/\.vault$/i, "");
      a.download = fileNameForUser;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err: any) {
      console.error("[ChainVault] Download/Decrypt error:", err);
      const errorMsg = err?.message || "Check your vault key or internet connection.";
      toast.error(`Error: ${errorMsg}`, { id: "dl-toast" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSharedDownload = async () => {
    if (!activeSharedBlob || !manualKey || !account) return;
    
    setDownloadingId(activeSharedBlob.blob_name);
    setIsDecryptModalOpen(false);
    
    try {
      const cleanName = activeSharedBlob.blob_name.includes('/') 
        ? activeSharedBlob.blob_name.split('/').slice(1).join('/') 
        : activeSharedBlob.blob_name;
      
      toast.loading("Fetching & Decrypting shared asset...", { id: "dl-shared-toast" });

      // 1. Fetch raw data
      const rawBlob = await fetchBlobData(activeSharedBlob.blob_name, activeSharedBlob.owner);
      
      // 2. Use manual key provided by owner
      const key = await getVaultKey(manualKey);
      const finalBlob = await decryptData(rawBlob, key);
      
      toast.success("Shared file decrypted successfully! 🔓", { id: "dl-shared-toast" });

      // 3. Download
      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      const fileNameForUser = cleanName
        .replace(ENCRYPTION_PREFIX, "")
        .replace("ENC:v1:", "")
        .replace(/\.vault$/i, "");
      a.download = `shared-${fileNameForUser}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setManualKey("");
    } catch (err: any) {
      console.error("[ChainVault] Shared Download error:", err);
      toast.error("Decryption failed. Please verify the owner's vault key.", { id: "dl-shared-toast" });
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
    onError: (err: any) => {
      console.error("[ChainVault] Delete error:", err);
      toast.error("Failed to delete from Shelby: " + (err?.message || "Unknown error"));
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Files</h1>
          <p className="text-muted-foreground text-sm">
            All files stored in your vault on{" "}
            <span className="font-medium text-primary">Shelby testnet</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={() => setRefresh(r => r + 1)}
             disabled={loading}
             className="gap-2"
           >
             <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
             Sync
           </Button>
           <Link to="/dashboard/upload">
             <Button variant="hero" size="sm" className="gap-2">
               <Upload className="h-3.5 w-3.5" />
               Upload File
             </Button>
           </Link>
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
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Shared</p>
            <p className="text-xl font-bold">{sharedBlobs.length}</p>
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
              onDownload={(b) => {
                setActiveSharedBlob(b);
                setIsDecryptModalOpen(true);
              }}
              isShared 
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Decryption Dialog for Shared Files */}
      <Dialog open={isDecryptModalOpen} onOpenChange={setIsDecryptModalOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card border-border/50 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" />
              Security Authorization
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              File <span className="text-foreground font-mono font-bold">"{activeSharedBlob?.blob_name.split('/').pop()?.replace('.vault','')}"</span> is encrypted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Decryption Context (Owner's Vault Key)
              </label>
              <Input
                type="password"
                placeholder="Enter the key provided by the owner..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="bg-muted/10 border-border/50"
              />
            </div>
            <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl flex gap-3">
              <Eye className="h-5 w-5 text-accent shrink-0" />
              <p className="text-[10px] text-accent-foreground leading-relaxed">
                Shared files require the original vault key for end-to-end decryption.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" className="rounded-lg" onClick={() => setIsDecryptModalOpen(false)}>Cancel</Button>
            <Button 
                onClick={handleSharedDownload}
                disabled={!manualKey || !!downloadingId}
                className="bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg"
            >
                {downloadingId === activeSharedBlob?.blob_name ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Verify & Decrypt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
              <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Asset Name</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell uppercase text-[10px]">Capacity</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell uppercase text-[10px]">Created At</th>
              <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Status</th>
              <th className="text-right px-5 py-3 font-medium uppercase text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b, idx) => {
              const cleanName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
              const isEncrypted = cleanName.startsWith(ENCRYPTION_PREFIX) || 
                                  cleanName.startsWith("ENC:v1:") || 
                                  cleanName.toLowerCase().endsWith(".vault");
              const displayName = isEncrypted 
                ? cleanName.replace(ENCRYPTION_PREFIX, "").replace("ENC:v1:", "").replace(/\.vault$/i, "")
                : cleanName;

              return (
                <tr key={b.blob_name} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
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
                      <a href={`https://explorer.aptoslabs.com/account/${b.owner}?network=testnet`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-xl transition-all">
                          <Compass className="h-4 w-4" />
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
