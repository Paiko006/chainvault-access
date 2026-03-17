import { useState } from "react";
import { ShieldCheck, FileText, UserPlus, Trash2, Search, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getStoredBlobs, saveStoredBlobs } from "@/types/storage";
import { toast } from "sonner";

export default function AccessControlPage() {
  const { connected, account } = useWallet();
  const [search, setSearch] = useState("");
  const [newWallet, setNewWallet] = useState<Record<string, string>>({});

  const myBlobs = getStoredBlobs().filter(
    (b) => !account || b.ownerAddress === account.address.toString()
  );

  const filtered = myBlobs.filter((b) =>
    b.blobName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddWallet = (blobName: string) => {
    const address = newWallet[blobName];
    if (!address || address.length < 10) {
      toast.error("Please enter a valid wallet address.");
      return;
    }

    const all = getStoredBlobs();
    const idx = all.findIndex(b => b.blobName === blobName);
    if (idx !== -1) {
      if (!all[idx].sharedWith) all[idx].sharedWith = [];
      if (all[idx].sharedWith.includes(address)) {
        toast.error("Wallet already has access.");
        return;
      }
      all[idx].sharedWith.push(address);
      saveStoredBlobs(all);
      toast.success(`Access granted to ${address.slice(0, 6)}...`);
      setNewWallet(prev => ({ ...prev, [blobName]: "" }));
    }
  };

  const handleRemoveWallet = (blobName: string, address: string) => {
    const all = getStoredBlobs();
    const idx = all.findIndex(b => b.blobName === blobName);
    if (idx !== -1 && all[idx].sharedWith) {
      all[idx].sharedWith = all[idx].sharedWith.filter(a => a !== address);
      saveStoredBlobs(all);
      toast.success("Access revoked.");
    }
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Access Control</h1>
          <p className="text-muted-foreground text-sm">Manage wallet-based access to your files.</p>
        </div>
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground">Connect your wallet to manage access permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Access Control</h1>
          <p className="text-muted-foreground text-sm">
            Configure which wallets can access your data on the Shelby network.
          </p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm text-primary">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          Permissions are managed via Shelby Protocol's programmable access layer. Adding a wallet here updates the metadata that Shelby uses to verify storage access.
        </p>
      </div>

      {myBlobs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files to manage access…"
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
      )}

      {myBlobs.length === 0 ? (
        <div className="glass-card p-14 text-center rounded-xl space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Upload files first to manage their access control.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground text-sm">No files match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.blobName} className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm truncate max-w-[250px]">{b.blobName}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                      {b.ownerAddress.slice(0, 10)}...{b.ownerAddress.slice(-6)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground">Authorized Wallets</h4>
                <div className="flex flex-wrap gap-2">
                  {(!b.sharedWith || b.sharedWith.length === 0) ? (
                    <span className="text-xs text-muted-foreground italic">Private (Only you)</span>
                  ) : (
                    b.sharedWith.map((addr) => (
                      <div key={addr} className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary text-xs font-mono border border-border/50">
                        {addr.slice(0, 6)}...{addr.slice(-4)}
                        <button 
                          onClick={() => handleRemoveWallet(b.blobName, addr)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Paste wallet address (0x...)"
                  value={newWallet[b.blobName] || ""}
                  onChange={(e) => setNewWallet(prev => ({ ...prev, [b.blobName]: e.target.value }))}
                  className="h-9 text-xs bg-muted/30"
                />
                <Button 
                  size="sm" 
                  className="gap-2 shrink-0"
                  onClick={() => handleAddWallet(b.blobName)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
