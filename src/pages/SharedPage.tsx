import { useState, useEffect } from "react";
import { Share2, FileText, ExternalLink, Search, X, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { fetchSharedBlobs, fromShelbyTimestamp, ShelbyBlob } from "@/lib/shelby-indexer";
import { shortenAddress } from "@/lib/wallet";

export default function SharedPage() {
  const { connected, account } = useWallet();
  const [search, setSearch] = useState("");
  const [sharedBlobs, setSharedBlobs] = useState<ShelbyBlob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !account) return;
    
    async function loadShared() {
      setLoading(true);
      try {
        const addr = account.address.toString();
        const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
        const data = await fetchSharedBlobs(addr, apiKey);
        setSharedBlobs(data);
      } catch (err) {
        console.error("Failed to load shared files:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShared();
  }, [connected, account]);

  const filtered = sharedBlobs.filter((b) =>
    b.blob_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Shared Files</h1>
          <p className="text-muted-foreground text-sm">Files shared with other wallet addresses.</p>
        </div>
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground">Connect your wallet to view shared files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Shared Files</h1>
        <p className="text-muted-foreground text-sm">
          Files you have shared with other wallet addresses on <span className="text-primary font-medium">Shelby network</span>.
        </p>
      </div>

      {sharedBlobs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shared files…"
            className="pl-9 bg-secondary/50 border-border/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {loading && sharedBlobs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
            Syncing Shared Assets...
          </p>
        </div>
      ) : sharedBlobs.length === 0 ? (
        <div className="glass-card p-14 text-center rounded-xl space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Share2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No shared assets discovered at this address.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground text-sm">No shared files match "{search}".</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-xl border-border/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground font-bold uppercase text-[10px]">
                  <th className="px-5 py-3">Asset Name</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3 hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const rawName = b.blob_name.includes('/') ? b.blob_name.split('/').slice(1).join('/') : b.blob_name;
                  const cleanName = rawName.replace("shelbysecure/", "").replace("ENC-v1-", "").replace(".vault", "");
                  
                  return (
                    <tr key={b.blob_name} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                          </div>
                          <span className="font-bold text-foreground truncate max-w-[200px]" title={cleanName}>
                            {cleanName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono border border-border/50">
                          {shortenAddress(b.owner)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden md:table-cell text-xs">
                         {fromShelbyTimestamp(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`https://explorer.shelby.xyz/testnet/blobs/${b.owner}?blobName=${encodeURIComponent(rawName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg border border-border/30 hover:bg-muted font-bold text-[11px] uppercase tracking-wider">
                            <ExternalLink className="h-3 w-3" />
                            Explorer
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
