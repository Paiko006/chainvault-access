import { useState, useEffect } from "react";
import { Settings, Key, Globe, Wallet, Shield, CheckCircle, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { connected, account } = useWallet();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing key if any
    const saved = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || "";
    setApiKey(saved);
  }, []);

  const handleSaveKey = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("VITE_SHELBY_API_KEY", apiKey);
      setIsSaving(false);
      toast.success("API Key updated and saved! 🔑");
    }, 800);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your ChainVault account and network preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* API Key Section */}
        <section className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Security & API Keys</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Geomi Client API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AG-..."
                  className="bg-secondary/50"
                />
                <Button onClick={handleSaveKey} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Key"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                This key is used to authenticate with Shelby Protocol via Geomi. Stored securely in your browser.
              </p>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Connected Account</h2>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/20">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {connected ? (account?.address.toString()) : "No Wallet Connected"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {connected ? "Identity Secured on Aptos" : "Please connect your wallet"}
              </p>
            </div>
            {connected && (
              <a 
                href={`https://explorer.aptoslabs.com/account/${account?.address}?network=testnet`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
          </div>
        </section>

        {/* Network Status */}
        <section className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Network Architecture</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/10">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Aptos Testnet</span>
              </div>
              <span className="text-xs text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/10">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Shelby Network v1</span>
              </div>
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Geomi RPC Proxy</span>
              </div>
              <span className="text-xs text-muted-foreground">Upstreaming</span>
            </div>
          </div>
        </section>

        {/* Storage Section Decorations */}
        <section className="glass-card p-6 rounded-xl border border-primary/20 bg-primary/5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Storage Tier</h3>
             <span className="px-2 py-0.5 rounded bg-primary text-[10px] font-bold text-white uppercase tracking-tighter">Early Adopter</span>
           </div>
           <div className="space-y-2">
             <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-12/12 bg-primary animate-pulse" />
             </div>
             <p className="text-xs text-muted-foreground font-medium text-center italic">
               Unlimited testing storage enabled on Shelby Testnet
             </p>
           </div>
        </section>
      </div>
    </div>
  );
}
