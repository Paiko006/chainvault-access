import { Link } from "react-router-dom";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Features", href: "/features", isExternal: false },
  { label: "Docs", href: "https://docs.shelby.xyz/", isExternal: true },
  { label: "Pricing", href: "/pricing", isExternal: false, highlight: true },
];

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors">
                <Menu className="h-6 w-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-black border-r border-border/50 p-0">
              <div className="flex flex-col h-full pt-20 px-6 gap-6">
                {links.map((link) => (
                  link.isExternal ? (
                    <a 
                      key={link.label}
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      key={link.label}
                      to={link.href} 
                      className={`text-lg font-medium transition-colors ${link.highlight ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-lg">ShelbySecure</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            link.isExternal ? (
              <a 
                key={link.label}
                href={link.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link 
                key={link.label}
                to={link.href} 
                className={`text-sm transition-colors ${link.highlight ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <WalletButton />
      </div>
    </nav>
  );
}
