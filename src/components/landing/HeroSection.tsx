import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import CanvasTextDemo from "@/components/canvas-text-demo";

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
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="hero-glow absolute inset-0 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground mb-4">
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span>Decentralized File Security</span>
          </div>

          <div className="mb-2">
            <CanvasTextDemo />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Secure Files with{" "}
            <span className="gradient-text">Wallet-Based</span>
            <br />
            Access Control
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload files to decentralized storage and control who can access them
            using wallet addresses. No passwords, no middlemen — just
            cryptographic security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
               variant="hero" 
               size="lg" 
               className="text-base px-8 py-6 rounded-xl"
               onClick={() => handleAction('/dashboard')}
            >
              Launch App
            </Button>
            <Button 
               variant="heroOutline" 
               size="lg" 
               className="text-base px-8 py-6 rounded-xl"
               onClick={() => handleAction('/dashboard/upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </motion.div>
      </div>
      
      <ConnectWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
