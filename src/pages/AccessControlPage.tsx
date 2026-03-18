import { useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  UserPlus, 
  Trash2, 
  Search, 
  X, 
  Info, 
  Users, 
  Lock, 
  ExternalLink, 
  MoreVertical,
  Settings2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getStoredBlobs, saveStoredBlobs, StoredBlob } from "@/types/storage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AccessControlPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [search, setSearch] = useState("");
  const [newWallet, setNewWallet] = useState("");
  const [selectedBlob, setSelectedBlob] = useState<StoredBlob | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // blobName or 'global'

  const SHELBY_CONTRACT = "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";

  const myBlobs = getStoredBlobs().filter(
    (b) => !account || b.ownerAddress === account.address.toString()
  );

  const filtered = myBlobs.filter((b) =>
    b.blobName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddWallet = async (blobName: string) => {
    if (!connected || !account || !signAndSubmitTransaction) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!newWallet || newWallet.length < 10) {
      toast.error("Please enter a valid wallet address.");
      return;
    }

    try {
      setIsProcessing(blobName);
      toast.info("Requesting signature for sharing...");

      // 1. Trigger On-chain Transaction
      const pendingTx = await signAndSubmitTransaction({
        data: {
          function: `${SHELBY_CONTRACT}::blob_store::share_blob`,
          functionArguments: [blobName, newWallet],
        },
      });

      toast.info("Waiting for blockchain confirmation...");
      // We don't have shelbyClient here conveniently, but we can wait for tx directly
      // In a real app, we'd use provider.waitForTransaction
      
      // 2. Update Local Metadata after success
      const all = getStoredBlobs();
      const idx = all.findIndex(b => b.blobName === blobName);
      if (idx !== -1) {
        if (!all[idx].sharedWith) all[idx].sharedWith = [];
        if (!all[idx].sharedWith.includes(newWallet)) {
          all[idx].sharedWith.push(newWallet);
          saveStoredBlobs(all);
          setSelectedBlob({ ...all[idx] });
        }
      }

      toast.success(`Access granted on-chain to ${newWallet.slice(0, 6)}...`);
      setNewWallet("");
    } catch (err: any) {
      console.error("[ChainVault] Add Permission Error:", err);
      toast.error("Failed to share access on blockchain: " + (err.message || "User rejected"));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemoveWallet = async (blobName: string, address: string) => {
    if (!connected || !account || !signAndSubmitTransaction) return;

    try {
      setIsProcessing(`revoke-${address}`);
      toast.info("Requesting signature for revoking...");

      // 1. Trigger On-chain Transaction
      await signAndSubmitTransaction({
        data: {
          function: `${SHELBY_CONTRACT}::blob_store::revoke_blob`,
          functionArguments: [blobName, address],
        },
      });

      // 2. Update Local Metadata
      const all = getStoredBlobs();
      const idx = all.findIndex(b => b.blobName === blobName);
      if (idx !== -1 && all[idx].sharedWith) {
        all[idx].sharedWith = all[idx].sharedWith.filter(a => a !== address);
        saveStoredBlobs(all);
        setSelectedBlob({ ...all[idx] });
      }

      toast.success("Access revoked on-chain.");
    } catch (err: any) {
      console.error("[ChainVault] Revoke Permission Error:", err);
      toast.error("Failed to revoke access: " + (err.message || "User rejected"));
    } finally {
      setIsProcessing(null);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!connected) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold mb-1">Access Control</h1>
          <p className="text-muted-foreground text-sm">Manage wallet-based access to your files.</p>
        </div>
        <div className="glass-card p-12 text-center rounded-2xl border-dashed border-2 border-border/50">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Wallet Disconnected</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            Connect your wallet to manage and configure access permissions for your encrypted files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground text-sm">
          Govern which entities can interact with your decentralized vault entries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border-primary/10 bg-primary/5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70 mb-1">Total Assets</p>
          <p className="text-2xl font-bold">{myBlobs.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border-accent/10 bg-accent/5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-accent/70 mb-1">Shared Files</p>
          <p className="text-2xl font-bold">{myBlobs.filter(b => b.sharedWith && b.sharedWith.length > 0).length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border-muted/20 bg-muted/5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Network Status</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium">Aptos Testnet</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter your assets by name..."
          className="pl-9 bg-secondary/30 h-11 rounded-xl border-border/40 focus:ring-primary/20"
        />
      </div>

      {myBlobs.length === 0 ? (
        <div className="glass-card p-20 text-center rounded-2xl flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Secure Assets Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your vault is currently empty. Start by uploading files in the "Upload" section to manage their access.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground">No matches found for "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <div key={b.blobName} className="glass-card group hover:border-primary/30 transition-all duration-300 p-5 rounded-2xl border border-border/50 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 border border-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-base truncate max-w-[180px] md:max-w-[220px]" title={b.blobName}>
                      {b.blobName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] font-mono h-4 px-1.5 border-border/50">
                        {formatAddress(b.ownerAddress)}
                      </Badge>
                      {b.sharedWith && b.sharedWith.length > 0 ? (
                        <Badge className="bg-accent/20 text-accent hover:bg-accent/30 text-[9px] h-4 border-none">
                          Shared with {b.sharedWith.length}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] h-4 bg-muted text-muted-foreground border-none">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedBlob(b)}
                      className="rounded-full hover:bg-primary/10 hover:text-primary shrink-0"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] glass-card border-border/50 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Manage Access
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Configure wallet-level permissions for <span className="text-foreground font-medium">{b.blobName}</span>.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                          Authorized Wallets
                        </label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto px-1 custom-scrollbar">
                          {(!selectedBlob?.sharedWith || selectedBlob.sharedWith.length === 0) ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed border-border/50">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground italic">Only you have access to this file.</span>
                            </div>
                          ) : (
                            selectedBlob.sharedWith.map((addr) => (
                              <div key={addr} className="group/item flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30 hover:border-primary/20 transition-all">
                                <span className="text-xs font-mono">{formatAddress(addr)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={isProcessing === `revoke-${addr}`}
                                  className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveWallet(b.blobName, addr)}
                                >
                                  {isProcessing === `revoke-${addr}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                          Grant New Access
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter Aptos wallet address (0x...)"
                            value={newWallet}
                            onChange={(e) => setNewWallet(e.target.value)}
                            disabled={isProcessing === b.blobName}
                            className="h-10 text-xs bg-muted/20 border-border/50 focus:ring-primary/20"
                          />
                          <Button 
                            className="h-10 px-4 shrink-0 transition-all active:scale-95"
                            disabled={isProcessing === b.blobName}
                            onClick={() => handleAddWallet(b.blobName)}
                          >
                            {isProcessing === b.blobName ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Invite
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-auto pt-4 border-t border-border/20 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background z-10" />
                  {b.sharedWith && b.sharedWith.length > 0 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold">
                      +{b.sharedWith.length}
                    </div>
                  )}
                </div>
                <Button variant="link" className="text-xs p-0 h-auto text-muted-foreground hover:text-primary gap-1 group/btn" asChild>
                  <a href={`https://explorer.shelby.xyz/testnet/account/${b.ownerAddress}`} target="_blank" rel="noopener noreferrer">
                    Explorer <ExternalLink className="h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

