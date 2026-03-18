import { Bell, ChevronDown, CheckCircle2, ShieldInfo, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const mockNotifications = [
    {
      id: 1,
      title: "Batch Upload Successful",
      time: "2 mins ago",
      icon: <Zap className="h-3 w-3 text-accent" />,
      color: "bg-accent/10"
    },
    {
      id: 2,
      title: "New Vault Secured",
      time: "1 hour ago",
      icon: <CheckCircle2 className="h-3 w-3 text-primary" />,
      color: "bg-primary/10"
    },
    {
      id: 3,
      title: "Welcome to ChainVault",
      time: "5 hours ago",
      icon: <ShieldInfo className="h-3 w-3 text-muted-foreground" />,
      color: "bg-muted"
    }
  ];

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div />

      <div className="flex items-center gap-4">
        <WalletButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card p-2 border-border/50 animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Notifications</span>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded uppercase tracking-tighter">3 New</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/30" />
            
            <div className="max-h-[300px] overflow-y-auto space-y-1 mt-1">
              {mockNotifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex gap-3 items-start p-3 rounded-xl cursor-pointer hover:bg-muted/50 focus:bg-muted/50 transition-all group">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg ${n.color} flex items-center justify-center shrink-0`}>
                    {n.icon}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator className="bg-border/30 mt-1" />
            <DropdownMenuItem className="justify-center text-xs text-muted-foreground hover:text-primary font-medium py-2 rounded-lg">
              View all notification logs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50 transition-all rounded-full border border-border/20 px-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent shadow-glow-sm" />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
