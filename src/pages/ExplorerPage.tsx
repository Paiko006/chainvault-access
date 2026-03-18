import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExternalLink, Globe, Shield, Wallet, Compass, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/wallet";

export default function ExplorerPage() {
  const { account, connected } = useWallet();

  const explorerLinks = [
    {
      name: "Shelby Explorer",
      description: "View your storage blobs and network activity on Shelby.",
      url: connected ? `https://explorer.shelby.xyz/testnet/account/${account?.address}` : "https://explorer.shelby.xyz/testnet",
      icon: Compass,
      color: "text-primary"
    },
    {
      name: "Aptos Explorer",
      description: "View your transactions and APT balance on Aptos Testnet.",
      url: connected ? `https://explorer.aptoslabs.com/account/${account?.address}?network=testnet` : "https://explorer.aptoslabs.com/?network=testnet",
      icon: Globe,
      color: "text-accent"
    }
  ];

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Blockchain & Network Explorer</h1>
        <p className="text-muted-foreground text-sm">Monitor your decentralized identity and storage status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {explorerLinks.map((link) => (
          <div key={link.name} className="glass-card p-6 rounded-xl flex flex-col justify-between hover:glow-sm transition-all duration-300">
            <div className="space-y-4">
              <div className={`h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center ${link.color}`}>
                <link.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{link.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
              </div>
            </div>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-6">
              <Button variant="outline" className="w-full gap-2 text-xs">
                Launch Explorer
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        ))}
      </div>

      <section className="glass-card p-8 rounded-xl space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Account Verification</h2>
        </div>

        {connected ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Active Wallet</div>
                  <div className="font-mono text-sm break-all">{account?.address.toString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Connected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/10">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Network</div>
                <div className="text-sm font-semibold">Shelby Testnet</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/10">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Protocol</div>
                <div className="text-sm font-semibold">V1 Release</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/10">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Identity</div>
                <div className="text-sm font-semibold">Decentralized Asset owner</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Please connect your wallet to see your network status.</p>
          </div>
        )}
      </section>

      {/* Direct Quick Links to Discovery */}
      <div className="flex flex-wrap gap-4">
         <a href="https://explorer.shelby.xyz/testnet/storage-providers" target="_blank" rel="noopener noreferrer">
           <Button variant="ghost" size="sm" className="gap-2 text-[11px] uppercase tracking-tighter">
             <Share2 className="h-3 w-3" />
             Live Storage Providers
           </Button>
         </a>
         <a href="https://explorer.shelby.xyz/testnet" target="_blank" rel="noopener noreferrer">
           <Button variant="ghost" size="sm" className="gap-2 text-[11px] uppercase tracking-tighter">
             <Compass className="h-3 w-3" />
             Recent Blobs
           </Button>
         </a>
      </div>
    </div>
  );
}
