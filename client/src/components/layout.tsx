import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, ListOrdered, Users, Gavel, FileCheck, LogOut, Activity, Brain, ScrollText, UserCircle, Shield, Crown, Banknote, Wrench, BarChart3, Wallet, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  { title: "Operations", url: "/operations", icon: Wrench },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Payouts", url: "/payouts", icon: Wallet },
  { title: "Admin", url: "/admin", icon: Settings },
  { title: "AI Queue", url: "/queue", icon: Brain },
  { title: "Orders", url: "/orders", icon: ListOrdered },
  { title: "Grinders", url: "/grinders", icon: Users },
  { title: "Bids", url: "/bids", icon: Gavel },
  { title: "Assignments", url: "/assignments", icon: FileCheck },
  { title: "Audit Log", url: "/audit-log", icon: ScrollText },
];

const grinderNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isStaff = user?.role === "staff" || user?.role === "owner";
  const isOwner = user?.role === "owner";
  const isElite = (user as any)?.discordRoles?.includes?.("1466370965016412316");
  const navItems = isStaff ? staffNavItems : grinderNavItems;
  const roleBadge = isOwner ? "Owner" : user?.role === "staff" ? "Staff" : isElite ? "Elite Grinder" : user?.role === "grinder" ? "Grinder" : "Member";

  const { data: grinderProfile } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    enabled: !isStaff,
  });
  const avatarUrl = grinderProfile?.grinder?.discordAvatarUrl || user?.profileImageUrl || undefined;

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-glow">GrindOps</span>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">
            {isStaff ? "MANAGEMENT" : "NAVIGATION"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url} 
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover-elevate"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
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
                  {user?.firstName || user?.discordUsername || "User"}
                </span>
                <Badge 
                  variant={isStaff ? "default" : "secondary"} 
                  className={`w-fit text-[10px] px-1.5 py-0 ${
                    isOwner ? "bg-[#fd853f]/20 text-[#fd853f] border-[#fd853f]/30" :
                    user?.role === "staff" ? "bg-[#4cadd0]/20 text-[#4cadd0] border-[#4cadd0]/30" :
                    isElite ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30" :
                    "bg-muted text-muted-foreground"
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
  const themeClass = user?.role === "owner" ? "theme-owner" : user?.role === "staff" ? "theme-staff" : "";
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className={`flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 ${themeClass}`}>
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full relative">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 sm:px-6 backdrop-blur-md bg-background/50 relative z-10">
            <SidebarTrigger className="hover-elevate hover:bg-white/10 p-2 rounded-md transition-colors" />
            <div className="ml-auto flex items-center gap-4">
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative z-10">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
