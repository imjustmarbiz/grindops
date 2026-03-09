import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, ListOrdered, Users, Gavel, FileCheck, LogOut, Brain, ScrollText, UserCircle, Shield, Crown, Banknote, Wrench, BarChart3, Wallet, Settings, Zap, Bell, BookOpen, ClipboardCheck, ClipboardList, FileBarChart, MessageCircle, MessageSquare, Tv, Calendar, CalendarDays, Newspaper, Star, LinkIcon, Package, DollarSign, AlertOctagon, Award, UserCheck, TrendingUp, Megaphone, Calculator } from "lucide-react";
import grindopsLogo from "@assets/grindops-sp-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatDrawer } from "@/components/chat-drawer";
import { SoundAlertsHelper } from "@/components/sound-alerts-helper";
import { LowerThirdNotifications } from "@/components/lower-third-notification";
import { SiteAlertTicker } from "@/components/site-alert-ticker";
import { ThemeDecorations } from "@/components/theme-decorations";
import { InteractiveTutorial, TutorialTrigger } from "@/components/interactive-tutorial";
import { useLoginTracker } from "@/hooks/use-activity-tracker";
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

export const staffNavItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "To-Do List", url: "/todo", icon: ClipboardList },
  { title: "My Performance", url: "/my-performance", icon: BarChart3 },
  { title: "Staff Overview", url: "/staff-overview", icon: UserCheck },
  { title: "Admin", url: "/admin", icon: Settings },
  { title: "Business Wallet", url: "/wallets", icon: Wallet },
  { title: "Business Performance", url: "/business", icon: DollarSign },
  { title: "Services", url: "/services", icon: Package },
  { title: "Grinders", url: "/grinders", icon: Users },
  { title: "Grinders Performance", url: "/tier-progress", icon: TrendingUp },
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Quote Generator", url: "/quote-generator", icon: Calculator },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Bids", url: "/bids", icon: Gavel },
  { title: "Orders", url: "/orders", icon: ListOrdered },
  { title: "Assignments", url: "/assignments", icon: FileCheck },
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
];

export function getFilteredStaffNavItems(isOwner: boolean, userId: string) {
  const BUSINESS_BLOCKED_IDS = ["872820240139046952"];
  const canSeeBusiness = isOwner && !BUSINESS_BLOCKED_IDS.includes(userId);
  return staffNavItems.filter(item => {
    if (item.url === "/business") return canSeeBusiness;
    if (item.url === "/staff-overview") return isOwner;
    return true;
  });
}

export const grinderNavItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/grinder/notifications", icon: Bell },
  { title: "To-Do List", url: "/grinder/todo", icon: ClipboardList },
  { title: "Available Orders", url: "/grinder/orders", icon: Zap },
  { title: "My Orders", url: "/grinder/assignments", icon: FileCheck },
  { title: "Repairs", url: "/grinder/order-claims", icon: Wrench },
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
];

export const creatorNavItems = [
  { title: "Overview", url: "/creator", icon: LayoutDashboard },
  { title: "Notifications", url: "/creator/notifications", icon: Bell },
  { title: "To-Do List", url: "/creator/todo", icon: ClipboardList },
  { title: "Promote", url: "/creator/promote", icon: Megaphone },
  { title: "Payouts", url: "/creator/payouts", icon: Banknote },
  { title: "Rules & Policy", url: "/creator/rules", icon: ScrollText },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isStaff = user?.role === "staff" || user?.role === "owner";
  const isCreator = user?.role === "creator";
  const isOwner = user?.role === "owner";
  const userId = (user as any)?.discordId || user?.id || "";
  const { data: grinderProfile } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    enabled: !isStaff && !isCreator,
  });
  const { data: creatorProfile } = useQuery<{ creator: { displayName: string; code: string } }>({
    queryKey: ["/api/creator/me"],
    enabled: isCreator,
  });
  const { data: sidebarNotifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
    enabled: isStaff || isCreator,
  });
  const unreadNotifCount = sidebarNotifs.filter(n => {
    const readBy = (n.readBy as string[]) || [];
    return !readBy.includes(userId);
  }).length;
  const creatorUnreadNotifCount = isCreator ? unreadNotifCount : 0;
  const { data: staffActionItems = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/action-items"],
    refetchInterval: 30000,
    enabled: isStaff,
  });
  const { data: staffTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/tasks"],
    refetchInterval: 30000,
    enabled: isStaff,
  });
  const staffTodoCount = staffActionItems.filter((i: any) => !i.dismissed).length + staffTasks.filter((t: any) => t.status === "pending").length;
  const creatorTodoIncomplete = (() => {
    if (!isCreator) return 0;
    try {
      const s = typeof localStorage !== "undefined" ? localStorage.getItem("grindops-creator-todo") : null;
      const completed: Record<string, boolean> = s ? JSON.parse(s) : {};
      const creator = creatorProfile?.creator as { youtubeUrl?: string | null; twitchUrl?: string | null; tiktokUrl?: string | null; instagramUrl?: string | null; xUrl?: string | null } | undefined;
      const hasLinked = creator && [creator.youtubeUrl, creator.twitchUrl, creator.tiktokUrl, creator.instagramUrl, creator.xUrl].some(Boolean);
      const tutorialDone = completed["tutorial"] ?? false;
      const linkSocialDone = completed["link-social"] || !!hasLinked;
      const rulesDone = completed["review-rules"] ?? false;
      return 3 - (tutorialDone ? 1 : 0) - (linkSocialDone ? 1 : 0) - (rulesDone ? 1 : 0);
    } catch {
      return 3;
    }
  })();
  const { data: grinderTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/tasks"],
    refetchInterval: 30000,
    enabled: !isStaff,
  });
  const grinderTodoCount = grinderTasks.filter((t: any) => t.status === "pending").length;
  const isElite = !isStaff && !isCreator && (grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316"));
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
    : isCreator
    ? creatorNavItems
    : grinderNavItems;
  const roleBadge = isOwner ? "Owner" : user?.role === "staff" ? "Staff" : isCreator ? "Creator" : isElite ? "Elite Grinder" : user?.role === "grinder" ? "Grinder" : "Member";
  const avatarUrl = grinderProfile?.grinder?.discordAvatarUrl || user?.profileImageUrl || undefined;

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarContent>
        <div className="p-4 sm:p-5 flex items-center shrink-0 isolate rounded-none [box-shadow:0_0_28px_rgba(0,0,0,0.45)]" style={{ background: 'hsl(var(--sidebar-background))' }}>
          <img src={grindopsLogo} alt="GrindOps" className="h-[3.78rem] w-auto max-w-full object-contain object-left sm:h-[4.32rem] border-0 bg-transparent [filter:contrast(1.15)] [mix-blend-mode:lighten]" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">
            {isStaff ? "Management" : isCreator ? "Creator Dashboard" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                const unreadAlerts = !isStaff && !isCreator && item.url === "/grinder/notifications" ? (grinderProfile?.unreadAlertCount || 0) : 0;
                const staffUnreadNotifs = isStaff && item.url === "/notifications" ? unreadNotifCount : 0;
                const creatorUnreadNotifs = isCreator && item.url === "/creator/notifications" ? creatorUnreadNotifCount : 0;
                const todoCount = isStaff && item.url === "/todo" ? staffTodoCount
                  : !isStaff && item.url === "/grinder/todo" ? grinderTodoCount
                  : isCreator && item.url === "/creator/todo" ? creatorTodoIncomplete
                  : 0;
                const badgeCount = unreadAlerts || staffUnreadNotifs || creatorUnreadNotifs || todoCount;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        data-nav-url={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? (isCreator ? "bg-primary/20 text-primary font-medium" : "font-medium")
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover-elevate"
                        }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 min-w-0 truncate">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge className={`border-0 text-[10px] px-1.5 py-0 min-w-[20px] text-center ${
                            isCreator ? "animate-badge-flash bg-primary/25 text-primary" :
                            todoCount > 0 ? "animate-pulse bg-amber-500/20 text-amber-400" : "animate-pulse bg-blue-500/20 text-blue-400"
                          }`}>{badgeCount}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 sm:p-4 shrink-0">
          <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-emerald-500/30 shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate" data-testid="text-user-name">
                  {isCreator
                    ? (creatorProfile?.creator?.displayName || user?.firstName || user?.discordUsername || "Creator")
                    : (grinderProfile?.grinder?.name || user?.firstName || user?.discordUsername || "User")}
                  {(isCreator
                    ? (creatorProfile?.creator?.code && ` (${creatorProfile.creator.code})`)
                    : (grinderProfile?.grinder?.discordUsername || user?.discordUsername)) && (
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">@{isCreator ? user?.discordUsername : (grinderProfile?.grinder?.discordUsername || user?.discordUsername)}</span>
                  )}
                </span>
                <Badge 
                  variant={isStaff ? "default" : "secondary"} 
                  className={`w-fit text-[10px] px-1.5 py-0 mt-0.5 ${
                    isOwner ? "bg-primary/20 text-primary border-primary/30" :
                    user?.role === "staff" ? "bg-[#4cadd0]/20 text-[#4cadd0] border-[#4cadd0]/30" :
                    isCreator ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    isElite ? "bg-cyan-950 text-cyan-300 border-cyan-500/40" :
                    "bg-[#1a1a3e] text-[#8b9aff] border-[#5865F2]/40"
                  }`}
                  data-testid="text-user-role"
                >
                  {isOwner ? <Crown className="w-3 h-3 mr-1" /> : isCreator ? <Star className="w-3 h-3 mr-1" /> : isElite ? <Crown className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                  {roleBadge}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              data-testid="button-logout"
              className="w-full justify-start gap-2 !border-black/40 bg-black/50 hover:bg-primary hover:!border-primary hover:text-primary-foreground text-white transition-all" 
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
  useLoginTracker();
  const { data: grinderProfileForTheme } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    enabled: !isStaffOrOwner && user?.role !== "creator",
  });
  const isEliteGrinder = !isStaffOrOwner && user?.role !== "creator" && (grinderProfileForTheme?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316"));
  const themeClass = user?.role === "owner" ? "theme-owner" : user?.role === "staff" ? "theme-staff" : user?.role === "creator" ? "theme-creator" : isEliteGrinder ? "theme-elite" : "theme-grinder";

  const { data: siteConfig } = useQuery<{ holidayTheme?: string; gameTheme?: string }>({
    queryKey: ["/api/config/maintenance"],
    refetchInterval: 60000,
  });
  const holidayThemeValue = siteConfig?.holidayTheme && siteConfig.holidayTheme !== "none" ? siteConfig.holidayTheme : null;
  const gameThemeValue = siteConfig?.gameTheme && siteConfig.gameTheme !== "none" ? siteConfig.gameTheme : null;
  const holidayThemeClass = holidayThemeValue ? `holiday-${holidayThemeValue}` : null;
  const gameThemeClass = gameThemeValue ? `game-${gameThemeValue}` : null;
  const activeDecoration = holidayThemeValue || gameThemeValue || null;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-owner", "theme-staff", "theme-grinder", "theme-elite", "theme-creator");
    root.classList.add(themeClass);
    return () => root.classList.remove(themeClass);
  }, [themeClass]);

  useEffect(() => {
    const root = document.documentElement;
    const allOverlays = ["holiday-christmas", "holiday-thanksgiving", "holiday-4th-of-july", "holiday-halloween", "holiday-valentines", "holiday-new-years", "holiday-st-patricks", "game-nba2k"];
    allOverlays.forEach(c => root.classList.remove(c));
    if (holidayThemeClass) root.classList.add(holidayThemeClass);
    if (gameThemeClass) root.classList.add(gameThemeClass);
    return () => { allOverlays.forEach(c => root.classList.remove(c)); };
  }, [holidayThemeClass, gameThemeClass]);

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
      <div className="flex h-dvh min-h-dvh max-h-dvh w-full bg-background overflow-hidden selection:bg-primary/30 text-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-0 relative">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 sm:px-5 md:px-6 backdrop-blur-md bg-background/50 relative z-10">
            <SidebarTrigger className="hover-elevate hover:bg-white/10 p-2 rounded-md transition-colors size-9 flex items-center justify-center shrink-0" />
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {user?.role !== "creator" && <SoundAlertsHelper />}
              <TutorialTrigger variant="inline" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(true)}
                className="relative size-9 shrink-0 hover-elevate hover:bg-white/10"
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
                className="relative size-9"
                onClick={() => setLocation(user?.role === "staff" || user?.role === "owner" ? "/notifications" : user?.role === "creator" ? "/creator/notifications" : "/grinder/notifications")}
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
          <main className="flex-1 min-h-0 overflow-auto p-3 sm:p-5 md:p-6 relative z-10">
            <div className="max-w-7xl mx-auto w-full min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ThemeDecorations theme={activeDecoration} />
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      {user?.role !== "creator" && <LowerThirdNotifications />}
      <SiteAlertTicker />
      <InteractiveTutorial />
    </SidebarProvider>
  );
}
