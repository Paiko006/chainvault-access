import { useState, useEffect } from "react";
import { Share2, FileText, Trash2, ExternalLink, Upload, Search, X, Loader2, Compass, RefreshCw, Download, Lock } from "lucide-react";
import { useDeleteBlobs } from "@shelby-protocol/react";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAccountBlobs, ShelbyBlob, formatBytes, fromShelbyTimestamp, fetchBlobData } from "@/lib/shelby-indexer";
import { getVaultKey, decryptData, ENCRYPTION_PREFIX } from "@/lib/crypto";

export default function FilesPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [search, setSearch] = useState("");
  const [blobs, setBlobs] = useState<ShelbyBlob[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (connected && account) {
        setLoading(true);
        try {
          const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
          const data = await fetchAccountBlobs(account.address.toString(), apiKey);
          setBlobs(data);
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
      const isEncrypted = b.blob_name.startsWith(ENCRYPTION_PREFIX);
      
      toast.loading(isEncrypted ? "Decrypting from Vault..." : "Downloading from Shelby...", { id: "dl-toast" });

      // 1. Fetch raw data from Shelby
      const rawBlob = await fetchBlobData(b.blob_name);
      
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
      // Remove prefix for the saved filename
      const cleanName = isEncrypted ? b.blob_name.replace(ENCRYPTION_PREFIX, "") : b.blob_name;
      a.download = cleanName;
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

  const deleteBlobs = useDeleteBlobs({
    onSuccess: () => {
      toast.success("Asset deleted from Shelby network! 🗑️");
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
      await deleteBlobs.mutateAsync({
        blobNames: [blobToDelete.blob_name],
        signer: {
          account: account.address,
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

      {/* Search */}
      {(blobs.length > 0 || search) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-9 bg-secondary/50 border-border/50"
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
          <p className="text-muted-foreground text-sm">
            No files found on Shelby Explorer for this account.
          </p>
          <Link to="/dashboard/upload">
            <Button variant="hero" size="sm" className="gap-2">
              <Upload className="h-3.5 w-3.5" />
              Upload First File
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground text-sm">
            No assets match "{search}".
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
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
                  <th className="text-left px-5 py-3 font-medium uppercase text-[10px]">Status</th>
                  <th className="text-right px-5 py-3 font-medium uppercase text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => {
                  const isEncrypted = b.blob_name.startsWith(ENCRYPTION_PREFIX);
                  const isDownloading = downloadingId === b.blob_name;

                  return (
                    <tr
                      key={b.blob_name}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center relative">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            {isEncrypted && (
                              <div className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5 border border-background">
                                <Lock className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={b.blob_name}>
                              {b.blob_name.replace(ENCRYPTION_PREFIX, "").split('/').pop()}
                            </span>
                            {isEncrypted && (
                              <span className="text-[9px] text-accent font-bold uppercase tracking-tighter">
                                Encrypted Vault
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        {formatBytes(b.size)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        {fromShelbyTimestamp(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          1 Year Vault
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-accent hover:bg-accent/10"
                            title="Decrypt & Download"
                            onClick={() => handleDownload(b)}
                            disabled={!!downloadingId}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <a
                            href={`https://explorer.shelby.xyz/testnet/blob/${encodeURIComponent(b.blob_name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="View on Shelby Explorer"
                            >
                              <Compass className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Delete from Shelby Protocol"
                            onClick={() => handleDelete(idx)}
                            disabled={deleteBlobs.isPending}
                          >
                            {deleteBlobs.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border/30 text-xs text-muted-foreground flex justify-between items-center">
            <span>{filtered.length} Asset{filtered.length !== 1 ? "s" : ""} Found</span>
            <a
              href={`https://explorer.shelby.xyz/testnet/account/${account?.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 font-bold text-primary transition-all"
            >
              Verify on Shelby Indexer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
