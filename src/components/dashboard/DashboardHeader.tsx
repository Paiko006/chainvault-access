import { useState } from "react";
import { Bell, ChevronDown, CheckCircle2, Shield, Zap, Info, AlertCircle, Trash2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useNotifications, NotificationType } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { SidebarContent } from "./SidebarContent";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { notifications, markAllAsRead, clearAll, markAsRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [open, setOpen] = useState(false);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-3 w-3 text-primary" />;
      case "info": return <Info className="h-3 w-3 text-blue-400" />;
      case "warning": return <AlertCircle className="h-3 w-3 text-yellow-400" />;
      case "error": return <AlertCircle className="h-3 w-3 text-destructive" />;
      default: return <Zap className="h-3 w-3 text-accent" />;
    }
  };

  const getColor = (type: NotificationType) => {
    switch (type) {
      case "success": return "bg-primary/10";
      case "info": return "bg-blue-400/10";
      case "warning": return "bg-yellow-400/10";
      case "error": return "bg-destructive/10";
      default: return "bg-accent/10";
    }
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-72 bg-sidebar h-full text-foreground">
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-display font-bold text-lg">ShelbySecure</span>
      </div>
      <div className="hidden lg:block w-1" />

      <div className="flex items-center gap-4">
        <WalletButton />

        <DropdownMenu onOpenChange={(open) => {
          if (!open && unreadCount > 0) {
            // Optional: Auto-mark as read when closing? 
            // Better to have a manual "Mark all as read"
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-colors">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card p-2 border-border/50 animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded uppercase tracking-tighter">
                    {unreadCount} New
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/30" />
            
            <div className="max-h-[350px] overflow-y-auto space-y-1 mt-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem 
                    key={n.id} 
                    className={`flex gap-3 items-start p-3 rounded-xl cursor-pointer hover:bg-muted/50 focus:bg-muted/50 transition-all group relative ${!n.read ? 'bg-primary/5' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    {!n.read && (
                      <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    <div className={`mt-0.5 h-8 w-8 rounded-lg ${getColor(n.type)} flex items-center justify-center shrink-0`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className={`text-sm leading-none transition-colors ${!n.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {n.title}
                      </span>
                      {n.description && (
                        <span className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {n.description}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(n.time, { addSuffix: true })}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            
            <DropdownMenuSeparator className="bg-border/30 mt-1" />
            <div className="flex items-center justify-between p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] text-muted-foreground hover:text-primary h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                Mark all as read
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] text-muted-foreground hover:text-destructive h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
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
