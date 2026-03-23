import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">ShelbySecure</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold text-primary">Pricing</a>
        </div>

        <WalletButton />
      </div>
    </nav>
  );
}
