import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, ListOrdered, Users, Gavel, FileCheck, LogOut, Brain, ScrollText, UserCircle, Shield, Crown, Banknote, Wrench, BarChart3, Wallet, Settings, Zap, Bell, BookOpen, ClipboardCheck, ClipboardList, FileBarChart, MessageCircle, MessageSquare, Tv, Calendar, CalendarDays, Newspaper, Star, LinkIcon, Package, DollarSign, AlertOctagon, Award, UserCheck, TrendingUp } from "lucide-react";
import spLogo from "@assets/image_1771930905137.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatDrawer } from "@/components/chat-drawer";
import { LowerThirdNotifications } from "@/components/lower-third-notification";
import { SiteAlertTicker } from "@/components/site-alert-ticker";
import { InteractiveTutorial } from "@/components/interactive-tutorial";
import type { MessageThread, Notification, ThreadParticipant } from "@shared/schema";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const staffNavItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "To-Do List", url: "/todo", icon: ClipboardList },
  { title: "Staff Overview", url: "/staff-overview", icon: UserCheck },
  { title: "Admin", url: "/admin", icon: Settings },
  { title: "Business Wallet", url: "/wallets", icon: Wallet },
  { title: "Business Performance", url: "/business", icon: DollarSign },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Services", url: "/services", icon: Package },
  { title: "Grinders", url: "/grinders", icon: Users },
  { title: "Tier Progress", url: "/tier-progress", icon: TrendingUp },
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Bids", url: "/bids", icon: Gavel },
  { title: "Orders", url: "/orders", icon: ListOrdered },
  { title: "Order Assignments", url: "/assignments", icon: FileCheck },
  { title: "Order Updates", url: "/order-updates", icon: MessageSquare },
  { title: "Order Repairs", url: "/order-claims", icon: Wrench },
  { title: "Grinder Payouts", url: "/payouts", icon: DollarSign },
  { title: "AI Queue", url: "/queue", icon: Brain },
  { title: "Scorecard & Queue Info", url: "/scorecard-guide", icon: Brain },
  { title: "Customer Reviews", url: "/reviews", icon: Star },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Streams", url: "/streams", icon: Tv },
  { title: "Events & Promos", url: "/events", icon: Calendar },
  { title: "Audit Log", url: "/audit-log", icon: ScrollText },
  { title: "Staff Notes", url: "/patch-notes", icon: Newspaper },
  { title: "Features", url: "/features", icon: BookOpen },
  { title: "Operations Guide", url: "/staff/ops-guide", icon: ScrollText },
];

const grinderNavItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/grinder/notifications", icon: Bell },
  { title: "To-Do List", url: "/grinder/todo", icon: ClipboardList },
  { title: "Available Orders", url: "/grinder/orders", icon: Zap },
  { title: "My Orders", url: "/grinder/assignments", icon: FileCheck },
  { title: "Order Repairs", url: "/grinder/order-claims", icon: Wrench },
  { title: "My Bids", url: "/grinder/bids", icon: Gavel },
  { title: "My Scorecard", url: "/grinder/scorecard", icon: ClipboardCheck },
  { title: "Queue", url: "/grinder/queue", icon: Brain },
  { title: "Scorecard & Queue Info", url: "/scorecard-guide", icon: Brain },
  { title: "Grinder Status", url: "/grinder/status", icon: Crown },
  { title: "Strikes & Policy", url: "/grinder/strikes", icon: AlertOctagon },
  { title: "Payouts", url: "/grinder/payouts", icon: Banknote },
  { title: "Customer Reviews", url: "/grinder/reviews", icon: Star },
  { title: "Calendar", url: "/grinder/calendar", icon: CalendarDays },
  { title: "Events & Promos", url: "/grinder/events", icon: Calendar },
  { title: "Staff Notes", url: "/grinder/patch-notes", icon: Newspaper },
  { title: "Features", url: "/grinder/guide", icon: BookOpen },
  { title: "Operations Guide", url: "/grinder/ops-guide", icon: ScrollText },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isStaff = user?.role === "staff" || user?.role === "owner";
  const isOwner = user?.role === "owner";
  const userId = (user as any)?.discordId || user?.id || "";
  const { data: grinderProfile } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    enabled: !isStaff,
  });
  const { data: sidebarNotifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
    enabled: isStaff,
  });
  const unreadNotifCount = sidebarNotifs.filter(n => {
    const readBy = (n.readBy as string[]) || [];
    return !readBy.includes(userId);
  }).length;
  const isElite = !isStaff && (grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316"));
  const BUSINESS_BLOCKED_IDS = ["872820240139046952"];
  const WALLET_RESTRICTED_IDS = ["872820240139046952"];
  const canSeeBusiness = isOwner && !BUSINESS_BLOCKED_IDS.includes(userId);
  const isWalletRestricted = WALLET_RESTRICTED_IDS.includes(userId);
  const navItems = isStaff
    ? staffNavItems.filter(item => {
        if (item.url === "/business") return canSeeBusiness;
        if (item.url === "/wallets") return true;
        if (item.url === "/staff-overview") return isOwner;
        return true;
      }).map(item => {
        if (item.url === "/wallets" && (!isOwner || isWalletRestricted)) return { ...item, title: "My Wallet" };
        return item;
      })
    : grinderNavItems;
  const roleBadge = isOwner ? "Owner" : user?.role === "staff" ? "Staff" : isElite ? "Elite Grinder" : user?.role === "grinder" ? "Grinder" : "Member";
  const avatarUrl = grinderProfile?.grinder?.discordAvatarUrl || user?.profileImageUrl || undefined;

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          <img src={spLogo} alt="SP Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
          <span className="font-display font-bold text-2xl tracking-tight text-glow">GrindOps</span>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">
            {isStaff ? "MANAGEMENT" : "NAVIGATION"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                const unreadAlerts = !isStaff && item.url === "/grinder/notifications" ? (grinderProfile?.unreadAlertCount || 0) : 0;
                const staffUnreadNotifs = isStaff && item.url === "/notifications" ? unreadNotifCount : 0;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "font-medium" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover-elevate"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.title}</span>
                        {(unreadAlerts > 0 || staffUnreadNotifs > 0) && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px] px-1.5 py-0 min-w-[20px] text-center animate-pulse">{unreadAlerts || staffUnreadNotifs}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate" data-testid="text-user-name">
                  {grinderProfile?.grinder?.name || user?.firstName || user?.discordUsername || "User"}
                  {(grinderProfile?.grinder?.discordUsername || user?.discordUsername) && (
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">(@{grinderProfile?.grinder?.discordUsername || user?.discordUsername})</span>
                  )}
                </span>
                <Badge 
                  variant={isStaff ? "default" : "secondary"} 
                  className={`w-fit text-[10px] px-1.5 py-0 ${
                    isOwner ? "bg-red-500/20 text-red-400 border-red-500/30" :
                    user?.role === "staff" ? "bg-[#4cadd0]/20 text-[#4cadd0] border-[#4cadd0]/30" :
                    isElite ? "bg-cyan-950 text-cyan-300 border-cyan-500/40" :
                    "bg-[#1a1a3e] text-[#8b9aff] border-[#5865F2]/40"
                  }`}
                  data-testid="text-user-role"
                >
                  {isOwner ? <Crown className="w-3 h-3 mr-1" /> : isElite ? <Crown className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                  {roleBadge}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              data-testid="button-logout"
              className="w-full justify-start gap-2 border-white/10 hover:bg-white/10 hover:text-destructive transition-colors hover-elevate" 
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const userId = (user as any)?.discordId || user?.id || "";
  const isStaffOrOwner = user?.role === "owner" || user?.role === "staff";
  const { data: grinderProfileForTheme } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    enabled: !isStaffOrOwner,
  });
  const isEliteGrinder = !isStaffOrOwner && (grinderProfileForTheme?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316"));
  const themeClass = user?.role === "owner" ? "theme-owner" : user?.role === "staff" ? "theme-staff" : isEliteGrinder ? "theme-elite" : "theme-grinder";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-owner", "theme-staff", "theme-grinder", "theme-elite");
    root.classList.add(themeClass);
    return () => root.classList.remove(themeClass);
  }, [themeClass]);

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  const { data: threads = [] } = useQuery<(MessageThread & { participants: ThreadParticipant[] })[]>({
    queryKey: ["/api/chat/threads"],
    refetchInterval: 30000,
  });

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const totalUnread = threads.reduce((sum, t) => {
    const myParticipant = t.participants?.find(p => p.userId === userId);
    return sum + (myParticipant?.unreadCount || 0);
  }, 0);

  const unreadNotifs = notifs.filter(n => {
    const readBy = (n.readBy as string[]) || [];
    return !readBy.includes(userId);
  }).length;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 text-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full relative">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 sm:px-6 backdrop-blur-md bg-background/50 relative z-10">
            <SidebarTrigger className="hover-elevate hover:bg-white/10 p-2 rounded-md transition-colors" />
            <div className="ml-auto flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(true)}
                className="relative hover-elevate hover:bg-white/10"
                data-testid="button-open-chat"
              >
                <MessageCircle className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setLocation(user?.role === "staff" || user?.role === "owner" ? "/notifications" : "/grinder/notifications")}
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-amber-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 md:p-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <LowerThirdNotifications />
      <SiteAlertTicker />
      <InteractiveTutorial />
    </SidebarProvider>
  );
}
