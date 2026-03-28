import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";

export function HeroSection() {
  const { connected } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    if (!connected) {
      setModalOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-transparent">
      <div className="hero-glow absolute inset-0 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4 py-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-sm text-foreground/80 mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all hover:bg-white/10 cursor-default">
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span className="tracking-wide">Decentralized File Security</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
            Secure Files with{" "}
            <span className="gradient-text drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">Wallet-Based</span>
            <br />
            Access Control
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Upload files to decentralized storage and control who can access them
            using wallet addresses. No passwords, no middlemen — just pure
            cryptographic security on Aptos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
            <Button
              variant="hero"
              size="lg"
              className="text-lg px-8 py-7 rounded-2xl glass-button font-display font-semibold transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto"
              onClick={() => handleAction('/dashboard')}
            >
              Launch App
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
              className="text-lg px-8 py-7 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-foreground w-full sm:w-auto"
              onClick={() => handleAction('/dashboard/upload')}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload File
            </Button>
          </div>
        </motion.div>
      </div>

      <ConnectWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
