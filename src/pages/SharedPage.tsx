import { useState } from "react";
import { Share2, FileText, ExternalLink, Search, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getStoredBlobs } from "@/types/storage";

export default function SharedPage() {
  const { connected, account } = useWallet();
  const [search, setSearch] = useState("");

  const sharedBlobs = getStoredBlobs().filter(
    (b) => 
      (!account || b.ownerAddress === account.address.toString()) && 
      b.sharedWith && b.sharedWith.length > 0
  );

  const filtered = sharedBlobs.filter((b) =>
    b.blobName.toLowerCase().includes(search.toLowerCase())
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

      {sharedBlobs.length === 0 ? (
        <div className="glass-card p-14 text-center rounded-xl space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Share2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">You haven't shared any files yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground text-sm">No shared files match "{search}".</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground font-medium">
                  <th className="px-5 py-3">File Name</th>
                  <th className="px-5 py-3">Shared With</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.blobName} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[200px]" title={b.blobName}>
                          {b.blobName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 min-w-[300px]">
                        {b.sharedWith.map((addr, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 border border-border/30 text-[10px] font-mono">
                            <Users className="h-2.5 w-2.5" />
                            {addr.slice(0, 6)}...{addr.slice(-4)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`https://explorer.shelby.xyz/testnet/blob/${b.blobName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
