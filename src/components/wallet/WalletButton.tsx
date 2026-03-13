import { useState } from "react";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/wallet";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function WalletButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { connected, account, disconnect, wallet } = useWallet();

  const handleCopy = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
    toast.info("Wallet disconnected");
  };

  if (!connected || !account || !wallet) {
    return (
      <>
        <Button
          variant="hero"
          size="sm"
          className="rounded-lg gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
        <ConnectWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors"
      >
        <div className="h-5 w-5 shrink-0">
          {(wallet as any)?.icon ? (
            <img src={(wallet as any).icon} alt={(wallet as any).name} className="h-full w-full object-contain" />
          ) : (
            <div className="h-full w-full rounded-full bg-secondary" />
          )}
        </div>
        <span className="text-muted-foreground font-mono text-xs">
          {shortenAddress(account.address)}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-xl p-2 space-y-1">
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <div className="text-xs text-muted-foreground">{(wallet as any)?.name}</div>
              <div className="text-xs font-mono text-foreground mt-0.5">{shortenAddress(account.address)}</div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
              Copy Address
            </button>

            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
