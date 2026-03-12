import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WALLET_PROVIDERS, useWalletStore } from "@/lib/wallet";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ open, onClose }: ConnectWalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { connect } = useWalletStore();

  const handleConnect = async (provider: typeof WALLET_PROVIDERS[0]) => {
    setConnecting(provider.id);
    try {
      // If wallet extension is not detected, simulate for demo
      let address: string;
      if (provider.detect()) {
        address = await provider.connect();
      } else {
        // Demo mode: generate a fake address
        await new Promise((r) => setTimeout(r, 1200));
        const rand = Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");
        address = "0x" + rand;
      }

      connect({
        name: provider.name,
        address,
        icon: provider.icon,
      });

      toast.success(`Connected to ${provider.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to connect wallet");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card w-full max-w-md p-6 glow-sm" onClick={(e) => e.stopPropagation()}>
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

              {/* Wallet list */}
              <div className="space-y-2">
                {WALLET_PROVIDERS.map((provider) => {
                  const detected = provider.detect();
                  const isConnecting = connecting === provider.id;

                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleConnect(provider)}
                      disabled={!!connecting}
                      className="w-full flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3.5 text-left transition-all hover:bg-secondary/60 hover:border-primary/30 hover:glow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-xl shrink-0`}>
                        {provider.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">{provider.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {detected ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-accent" />
                              Detected
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              Demo mode
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <p className="text-xs text-muted-foreground text-center mt-5">
                If a wallet is not installed, demo mode generates a test address.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
