import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { useEffect } from "react";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Queue from "@/pages/queue";
import Orders from "@/pages/orders";
import Grinders from "@/pages/grinders";
import Bids from "@/pages/bids";
import Assignments from "@/pages/assignments";
import AuditLogPage from "@/pages/audit-log";
import GrinderProfile from "@/pages/grinder-profile";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, staffOnly = false }: { component: React.ComponentType; staffOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

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

function HomeRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

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
    return (
      <AppLayout>
        <AccessDeniedPage />
      </AppLayout>
    );
  }

  if (user?.role === "staff" || user?.role === "owner") {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <GrinderProfile />
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
      <Route path="/queue" component={() => <ProtectedRoute component={Queue} staffOnly />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} staffOnly />} />
      <Route path="/grinders" component={() => <ProtectedRoute component={Grinders} staffOnly />} />
      <Route path="/bids" component={() => <ProtectedRoute component={Bids} staffOnly />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={Assignments} staffOnly />} />
      <Route path="/audit-log" component={() => <ProtectedRoute component={AuditLogPage} staffOnly />} />
      
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
