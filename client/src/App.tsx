import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { useEffect } from "react";

// Page Imports
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Queue from "@/pages/queue";
import Orders from "@/pages/orders";
import Grinders from "@/pages/grinders";
import Bids from "@/pages/bids";
import Assignments from "@/pages/assignments";
import { Loader2 } from "lucide-react";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <AppLayout>
      <Component />
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
      
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/queue" component={() => <ProtectedRoute component={Queue} />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} />} />
      <Route path="/grinders" component={() => <ProtectedRoute component={Grinders} />} />
      <Route path="/bids" component={() => <ProtectedRoute component={Bids} />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={Assignments} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode on mount
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
