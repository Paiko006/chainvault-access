import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ open, onClose }: ConnectWalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { wallets, connect } = useWallet();

  const handleConnect = async (walletName: string) => {
    setConnecting(walletName);
    try {
      await connect(walletName);
      toast.success(`Wallet connection initiated...`);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(null);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 h-screen w-screen"
          >
            <div className="glass-card w-full max-w-md p-6 glow-sm relative z-[120]" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Connect Wallet</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Choose a wallet to connect
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {(!wallets || wallets.length === 0) ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center bg-secondary/20 rounded-xl border border-border/50">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">No Wallets Detected</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      You don't have an Aptos wallet installed. Please install one to continue.
                    </p>
                    <a 
                      href="https://petra.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Install Petra Wallet <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  wallets.map((w: { name: string; icon?: string }) => {
                    const walletName = w.name;
                    const walletIcon = w.icon;
                    const isConnecting = connecting === walletName;

                    return (
                      <button
                        key={walletName}
                        onClick={() => handleConnect(walletName)}
                        disabled={!!connecting}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3.5 text-center transition-all hover:bg-secondary/60 hover:border-primary/30 hover:glow-sm disabled:opacity-50 disabled:cursor-not-allowed group relative"
                      >
                        <div className="h-8 w-8 shrink-0 absolute left-4">
                          {walletIcon ? (
                            <img src={walletIcon} alt={`${walletName} icon`} className="h-full w-full object-contain" />
                          ) : (
                            <div className="h-full w-full rounded-full bg-secondary" />
                          )}
                        </div>

                        <div className="font-semibold text-sm text-foreground">{walletName}</div>

                        <div className="shrink-0 absolute right-4">
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
