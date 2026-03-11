import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { useEffect } from "react";
import { Construction, ShieldAlert, Loader2 } from "lucide-react";
import { GRINDER_ROLES } from "@shared/schema";

import AuthPage from "@/pages/auth";
import StaffOverview from "@/pages/staff/overview";
import StaffAnalytics from "@/pages/staff/analytics";
import StaffPayouts from "@/pages/staff/payouts";
import StaffAdmin from "@/pages/staff/admin";
import StaffReports from "@/pages/staff/reports";
import StaffStreams from "@/pages/staff/streams";
import Queue from "@/pages/queue";
import Orders from "@/pages/orders";
import Grinders from "@/pages/grinders";
import Bids from "@/pages/bids";
import Assignments from "@/pages/assignments";
import AuditLogPage from "@/pages/audit-log";
import GrinderProfile from "@/pages/grinder-profile";
import GrinderOverview from "@/pages/grinder/overview";
import GrinderOrders from "@/pages/grinder/orders";
import GrinderAssignments from "@/pages/grinder/assignments";
import GrinderBids from "@/pages/grinder/bids";
import GrinderPayouts from "@/pages/grinder/payouts";
import GrinderStatus from "@/pages/grinder/status";

import ScorecardGuide from "@/pages/scorecard-guide";
import GrinderScorecard from "@/pages/grinder/scorecard";
import GrinderQueue from "@/pages/grinder/queue";
import StaffEvents from "@/pages/staff/events";
import GrinderEvents from "@/pages/grinder/events";
import StaffPatchNotes from "@/pages/staff/patch-notes";
import StaffReviews from "@/pages/staff/reviews";
import StaffOrderClaims from "@/pages/staff/order-claims";
import GrinderPatchNotes from "@/pages/grinder/patch-notes";
import GrinderReviews from "@/pages/grinder/reviews";
import GrinderOrderClaims from "@/pages/grinder/order-claims";
import StaffCalendar from "@/pages/staff/calendar";
import StaffServices from "@/pages/staff/services";
import BusinessPerformance from "@/pages/staff/business";
import GrinderCalendar from "@/pages/grinder/calendar";
import GrinderTodo from "@/pages/grinder/todo";
import GrinderStrikes from "@/pages/grinder/strikes";
import GrinderNotifications from "@/pages/grinder/notifications";

import CreatorOverview from "@/pages/creator/overview";
import CreatorPromote from "@/pages/creator/promote";
import CreatorPayouts from "@/pages/creator/payouts";
import CreatorRules from "@/pages/creator/rules";
import CreatorNotifications from "@/pages/creator/notifications";
import CreatorTodo from "@/pages/creator/todo";

import CustomerReviewPage from "@/pages/customer-review";
import StaffNotifications from "@/pages/staff/notifications";
import StaffTodo from "@/pages/staff/todo";
import StaffBadges from "@/pages/staff/badges";
import QuoteGeneratorPage from "@/pages/staff/quote-generator";
import StaffCreatorProfile from "@/pages/staff/creator-profile";
import StaffOverviewPage from "@/pages/staff/staff-overview";
import StaffCreatorPayouts from "@/pages/staff/creator-payouts";
import StaffWallets from "@/pages/staff/wallets";
import TierProgress from "@/pages/staff/tier-progress";
import StaffOrderUpdates from "@/pages/staff/order-updates";
import StaffCustomers from "@/pages/staff/customers";
import CustomerOverview from "@/pages/customer/overview";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerVipPerks from "@/pages/customer/vip-perks";
import CustomerNotifications from "@/pages/customer/notifications";
import MyPerformance from "@/pages/staff/my-performance";

const BUSINESS_BLOCKED_IDS = ["872820240139046952"];

function MaintenancePage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 p-6 text-center" data-testid="page-maintenance">
      <Construction className="w-16 h-16 text-yellow-500" />
      <h1 className="text-2xl font-bold">Maintenance Mode Active</h1>
      <p className="text-muted-foreground max-w-md">
        The dashboard is currently undergoing maintenance. Please check back shortly.
      </p>
      <a href="/api/logout" className="text-primary underline text-sm mt-2">Sign out</a>
    </div>
  );
}

function AccessRestrictedPage({ allowedRoles }: { allowedRoles: string[] }) {
  const roleLabels: Record<string, string> = { owner: "Owner", staff: "Staff", grinder: "Grinder", elite: "Elite Grinder", creator: "Creator", customer: "Customer" };
  const allowedList = allowedRoles.map((r) => roleLabels[r] || r).join(", ");
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 p-6 text-center" data-testid="page-access-restricted">
      <ShieldAlert className="w-16 h-16 text-amber-500" />
      <h1 className="text-2xl font-bold">Access Restricted</h1>
      <p className="text-muted-foreground max-w-md">
        The dashboard is currently restricted to: {allowedList || "No roles"}.
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        If you believe you should have access, please contact staff in the Discord server.
      </p>
      <a href="/api/logout" className="text-primary underline text-sm mt-2">Sign out</a>
    </div>
  );
}

function hasEliteRole(user: any): boolean {
  const discordRoles: string[] = (user as any)?.discordRoles || [];
  return discordRoles.includes(GRINDER_ROLES.ELITE);
}

function getUserEffectiveRole(user: any): string | null {
  const role = user?.role;
  if (role === "owner") return "owner";
  if (role === "staff") return "staff";
  if (role === "creator") return "creator";
  if (role === "customer") return "customer";
  if (role === "grinder") return hasEliteRole(user) ? "elite" : "grinder";
  return null;
}

function ProtectedRoute({ component: Component, staffOnly = false, ownerOnly = false, creatorOnly = false, customerOnly = false, blockedDiscordIds }: { component: React.ComponentType; staffOnly?: boolean; ownerOnly?: boolean; creatorOnly?: boolean; customerOnly?: boolean; blockedDiscordIds?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: maintenanceData } = useQuery<{ maintenanceMode: boolean; maintenanceModeSetBy: string | null; earlyAccessMode: boolean; allowedAccessRoles?: string[] }>({
    queryKey: ["/api/config/maintenance"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const actorUsername = ((user as any)?.discordUsername || "").toLowerCase();
  const actorDiscordId = (user as any)?.discordId || (user as any)?.id || "";
  const canBypassMaintenance = actorUsername === "imjustmar" || actorUsername === "demoowner" || actorDiscordId === "172526626888876032";
  if (maintenanceData?.maintenanceMode && !canBypassMaintenance) {
    return <MaintenancePage />;
  }

  const allowedRoles = maintenanceData?.allowedAccessRoles ?? (maintenanceData?.earlyAccessMode ? ["owner", "staff", "elite"] : ["owner", "staff", "grinder", "elite", "creator", "customer"]);
  const effectiveRole = getUserEffectiveRole(user);
  if (!effectiveRole) {
    return <AccessDeniedPageFullScreen />;
  }
  if (!allowedRoles.includes(effectiveRole)) {
    return <AccessRestrictedPage allowedRoles={allowedRoles} />;
  }

  if (blockedDiscordIds) {
    const discordId = (user as any)?.discordId || "";
    if (blockedDiscordIds.includes(discordId)) {
      return <Redirect to="/" />;
    }
  }

  if (ownerOnly && user?.role !== "owner") {
    return <Redirect to="/" />;
  }

  if (creatorOnly && user?.role !== "creator") {
    return <Redirect to="/" />;
  }

  if (customerOnly && user?.role !== "customer") {
    return <Redirect to="/" />;
  }

  if (staffOnly && user?.role !== "staff" && user?.role !== "owner") {
    return <Redirect to="/" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don't have the required Discord role to access this application.</p>
      <p className="text-sm text-muted-foreground">You need either a Staff or Grinder role in the Discord server.</p>
      <a href="/api/logout" className="text-primary underline">Sign out and try a different account</a>
    </div>
  );
}

function AccessDeniedPageFullScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 p-6 text-center" data-testid="page-access-denied">
      <ShieldAlert className="w-16 h-16 text-amber-500" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground max-w-md">
        You don't have the required Discord role to access this application. You need either a Staff or Grinder role in the Discord server.
      </p>
      <a href="/api/logout" className="text-primary underline text-sm mt-2">Sign out</a>
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: maintenanceData } = useQuery<{ maintenanceMode: boolean; maintenanceModeSetBy: string | null; earlyAccessMode: boolean; allowedAccessRoles?: string[] }>({
    queryKey: ["/api/config/maintenance"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role === "none") {
    return <AccessDeniedPageFullScreen />;
  }

  const allowedRoles = maintenanceData?.allowedAccessRoles ?? (maintenanceData?.earlyAccessMode ? ["owner", "staff", "elite"] : ["owner", "staff", "grinder", "elite", "creator", "customer"]);
  const effectiveRole = getUserEffectiveRole(user);
  if (!effectiveRole) {
    return <AccessDeniedPageFullScreen />;
  }
  if (!allowedRoles.includes(effectiveRole)) {
    return <AccessRestrictedPage allowedRoles={allowedRoles} />;
  }

  const isStaffOrOwner = user?.role === "staff" || user?.role === "owner";
  if (isStaffOrOwner) {
    return (
      <AppLayout>
        <StaffOverview />
      </AppLayout>
    );
  }

  if (user?.role === "creator") {
    return <Redirect to="/creator" />;
  }

  if (user?.role === "customer") {
    return <Redirect to="/customer" />;
  }

  return (
    <AppLayout>
      <GrinderOverview />
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {!isLoading && isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      <Route path="/" component={HomeRedirect} />
      <Route path="/notifications" component={() => <ProtectedRoute component={StaffNotifications} staffOnly />} />
      <Route path="/todo" component={() => <ProtectedRoute component={StaffTodo} staffOnly />} />
      <Route path="/staff-overview" component={() => <ProtectedRoute component={StaffOverviewPage} ownerOnly />} />
      <Route path="/operations" component={() => <Redirect to="/admin" />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={StaffAnalytics} ownerOnly />} />
      <Route path="/payouts" component={() => <ProtectedRoute component={StaffPayouts} staffOnly />} />
      <Route path="/creator-payouts" component={() => <ProtectedRoute component={StaffCreatorPayouts} staffOnly />} />
      <Route path="/admin" component={() => <ProtectedRoute component={StaffAdmin} staffOnly />} />
      <Route path="/queue" component={() => <ProtectedRoute component={Queue} staffOnly />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} staffOnly />} />
      <Route path="/customers" component={() => <ProtectedRoute component={StaffCustomers} staffOnly />} />
      <Route path="/grinders" component={() => <ProtectedRoute component={Grinders} staffOnly />} />
      <Route path="/tier-progress" component={() => <ProtectedRoute component={TierProgress} staffOnly />} />
      <Route path="/bids" component={() => <ProtectedRoute component={Bids} staffOnly />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={Assignments} staffOnly />} />
      <Route path="/order-updates" component={() => <ProtectedRoute component={StaffOrderUpdates} staffOnly />} />
      <Route path="/reports" component={() => <ProtectedRoute component={StaffReports} staffOnly />} />
      <Route path="/streams" component={() => <ProtectedRoute component={StaffStreams} staffOnly />} />
      <Route path="/audit-log" component={() => <ProtectedRoute component={AuditLogPage} staffOnly />} />
      <Route path="/events" component={() => <ProtectedRoute component={StaffEvents} staffOnly />} />
      <Route path="/patch-notes" component={() => <ProtectedRoute component={StaffPatchNotes} staffOnly />} />
      <Route path="/reviews" component={() => <ProtectedRoute component={StaffReviews} staffOnly />} />
      <Route path="/order-claims" component={() => <ProtectedRoute component={StaffOrderClaims} staffOnly />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={StaffCalendar} staffOnly />} />
      <Route path="/services" component={() => <ProtectedRoute component={StaffServices} staffOnly />} />
      <Route path="/business" component={() => <ProtectedRoute component={BusinessPerformance} ownerOnly blockedDiscordIds={BUSINESS_BLOCKED_IDS} />} />
      <Route path="/wallets" component={() => <ProtectedRoute component={StaffWallets} staffOnly />} />
      <Route path="/badges" component={() => <ProtectedRoute component={StaffBadges} staffOnly />} />
      <Route path="/quote-generator" component={() => <ProtectedRoute component={QuoteGeneratorPage} staffOnly />} />
      <Route path="/staff/creators/:id" component={() => <ProtectedRoute component={StaffCreatorProfile} staffOnly />} />
      <Route path="/my-performance" component={() => <ProtectedRoute component={MyPerformance} staffOnly />} />
      
      <Route path="/grinder/orders" component={() => <ProtectedRoute component={GrinderOrders} />} />
      <Route path="/grinder/assignments" component={() => <ProtectedRoute component={GrinderAssignments} />} />
      <Route path="/grinder/bids" component={() => <ProtectedRoute component={GrinderBids} />} />
      <Route path="/grinder/payouts" component={() => <ProtectedRoute component={GrinderPayouts} />} />
      <Route path="/grinder/notifications" component={() => <ProtectedRoute component={GrinderNotifications} />} />
      <Route path="/grinder/status" component={() => <ProtectedRoute component={GrinderStatus} />} />
      <Route path="/grinder/scorecard" component={() => <ProtectedRoute component={GrinderScorecard} />} />
      <Route path="/grinder/queue" component={() => <ProtectedRoute component={GrinderQueue} />} />
      <Route path="/grinder/events" component={() => <ProtectedRoute component={GrinderEvents} />} />
      <Route path="/grinder/patch-notes" component={() => <ProtectedRoute component={GrinderPatchNotes} />} />
      <Route path="/grinder/reviews" component={() => <ProtectedRoute component={GrinderReviews} />} />
      <Route path="/grinder/order-claims" component={() => <ProtectedRoute component={GrinderOrderClaims} />} />
      <Route path="/grinder/calendar" component={() => <ProtectedRoute component={GrinderCalendar} />} />
      <Route path="/grinder/todo" component={() => <ProtectedRoute component={GrinderTodo} />} />
      <Route path="/grinder/strikes" component={() => <ProtectedRoute component={GrinderStrikes} />} />
      <Route path="/scorecard-guide" component={() => <ProtectedRoute component={ScorecardGuide} />} />

      <Route path="/creator" component={() => <ProtectedRoute component={CreatorOverview} creatorOnly />} />
      <Route path="/customer" component={() => <ProtectedRoute component={CustomerOverview} customerOnly />} />
      <Route path="/customer/orders" component={() => <ProtectedRoute component={CustomerOrders} customerOnly />} />
      <Route path="/customer/orders/:orderId" component={() => <ProtectedRoute component={CustomerOrderDetail} customerOnly />} />
      <Route path="/customer/vip-perks" component={() => <ProtectedRoute component={CustomerVipPerks} customerOnly />} />
      <Route path="/customer/notifications" component={() => <ProtectedRoute component={CustomerNotifications} customerOnly />} />
      <Route path="/creator/promote" component={() => <ProtectedRoute component={CreatorPromote} creatorOnly />} />
      <Route path="/creator/payouts" component={() => <ProtectedRoute component={CreatorPayouts} creatorOnly />} />
      <Route path="/creator/rules" component={() => <ProtectedRoute component={CreatorRules} creatorOnly />} />
      <Route path="/creator/notifications" component={() => <ProtectedRoute component={CreatorNotifications} creatorOnly />} />
      <Route path="/creator/todo" component={() => <ProtectedRoute component={CreatorTodo} creatorOnly />} />
      
      <Route path="/customer-review" component={CustomerReviewPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
