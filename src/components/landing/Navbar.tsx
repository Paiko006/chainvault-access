import { Link } from "react-router-dom";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain group-hover:scale-110 transition-transform" />
          <span className="font-display font-bold text-lg">ShelbySecure</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <a href="https://docs.shelby.xyz/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold text-primary">Pricing</Link>
        </div>

        <WalletButton />
      </div>
    </nav>
  );
}
