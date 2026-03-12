import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Lock, Download, ShieldOff, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function LockerPage() {
  const [params] = useSearchParams();
  const fileId = params.get("id") || "SHB-00000";
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  const AUTHORIZED_WALLET = "0x7a3Bf29D";

  const checkAccess = () => {
    if (wallet.toLowerCase().includes("7a3b")) {
      setStatus("granted");
    } else {
      setStatus("denied");
    }
  };

  if (status === "granted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md w-full text-center glow-sm"
        >
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Granted</h1>
          <p className="text-muted-foreground text-sm mb-6">File ID: <span className="font-mono">{fileId}</span></p>

          <div className="glass-card p-4 rounded-lg mb-6 flex items-center gap-3">
            <FileText className="h-10 w-10 text-primary shrink-0" />
            <div className="text-left">
              <div className="font-medium">report-q4.pdf</div>
              <div className="text-xs text-muted-foreground">1.2 MB • Uploaded Mar 10, 2026</div>
            </div>
          </div>

          <Button variant="hero" className="w-full rounded-xl py-5">
            <Download className="mr-2 h-4 w-4" /> Download File
          </Button>
        </motion.div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Your wallet is not authorized to access this file.
          </p>
          <p className="text-xs text-muted-foreground mb-6 font-mono">{wallet}</p>
          <Button variant="outline" onClick={() => setStatus("idle")} className="rounded-xl">
            Try Another Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">File Locker</h1>
        <p className="text-muted-foreground text-sm mb-1">
          File ID: <span className="font-mono">{fileId}</span>
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your wallet address to verify access.
        </p>

        <div className="space-y-3">
          <Input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm bg-secondary/50 text-center"
          />
          <Button variant="hero" className="w-full rounded-xl py-5" onClick={checkAccess} disabled={!wallet}>
            Verify Access
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Hint: Use a wallet containing "7a3b" to test access.
        </p>
      </motion.div>
    </div>
  );
}
