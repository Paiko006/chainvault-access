import { Bell, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
      <div />

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm">
          <Wallet className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground font-mono text-xs">0x7a3B...f29D</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent" />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
