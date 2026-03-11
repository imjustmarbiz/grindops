import { Button } from "@/components/ui/button";
import { Shield, BarChart3, ClipboardList, Bell } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GrindOpsLogo } from "@/components/grindops-logo";
import DevProfiles from "@/components/dev-profiles";

const RETURNING_USER_KEY = "grindops-login-returning";

export default function AuthPage() {
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem(RETURNING_USER_KEY);
    setIsReturning(flag === "true");
    localStorage.setItem(RETURNING_USER_KEY, "true");
  }, []);
  const handleLogin = () => {
    window.location.href = "/api/auth/discord/login";
  };

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  const features = [
    { icon: ClipboardList, title: "Order Management", desc: "Bidding, assignments & live tracking" },
    { icon: BarChart3, title: "Performance Tracking", desc: "Scorecards, tiers & quality metrics" },
    { icon: Bell, title: "Real-Time Updates", desc: "Discord sync & instant notifications" },
    { icon: Shield, title: "Role-Based Access", desc: "Owner, Staff, Grinder, Elite & Creator dashboards" },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col lg:flex-row bg-background overflow-x-hidden selection:bg-primary/30 text-foreground">
      {/* Left panel: branding + features — hidden on small screens, full on lg */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col p-8 xl:p-12 border-r border-white/[0.06] relative overflow-hidden justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />
          <div className="absolute top-1/4 -left-20 w-[420px] h-[420px] bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-[320px] h-[320px] bg-primary/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-0 flex-1 justify-center">
          <div className="flex items-center gap-3 mb-12">
            <GrindOpsLogo className="h-16 w-auto xl:h-[4.5rem] text-foreground" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-5">
              Your complete{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                operations hub
              </span>
              .
            </h1>
            <p className="text-base xl:text-lg text-muted-foreground max-w-md lg:max-w-xl leading-relaxed">
              Role-based dashboards for all five: Owner, Staff, Grinder, Elite, and Creator. Manage operations, orders, bids, assignments, payouts, and performance — all in one place.
            </p>
          </motion.div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-5 mt-10">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: sign-in — stacks on mobile with richer visuals */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-8 relative min-h-[100dvh] lg:min-h-0 overflow-y-auto">
        {/* Mobile-only: stronger gradient and soft grid for depth */}
        <div className="absolute inset-0 z-0 lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,420px)] h-[280px] bg-primary/12 rounded-full blur-[90px]" />
          <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-primary/8 rounded-full blur-[60px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none lg:hidden z-[1]" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md lg:max-w-lg xl:max-w-xl space-y-6 sm:space-y-8 relative z-10 pt-6 lg:pt-0 pb-8 mx-auto"
        >
          {/* Mobile: hero logo + tagline + feature pills */}
          <div className="lg:hidden space-y-6 w-full flex flex-col items-center">
            <div className="flex flex-col items-center text-center space-y-4 bg-transparent w-full">
              <div className="w-full flex justify-center shrink-0">
                <GrindOpsLogo className="h-24 w-auto sm:h-28 max-w-[95%] text-foreground shrink-0" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  Your complete <span className="text-primary">operations hub</span>
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Sign in with Discord to access your role-based dashboard.
                </p>
              </div>
            </div>
            {/* Compact feature pills on mobile */}
            <div className="flex flex-wrap justify-center gap-2">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]"
                >
                  <feature.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">{feature.title}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sign-in card — dashboard-style panel */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground" data-testid="text-welcome">
                  {isReturning ? "Welcome Back" : "Sign in to GrindOps"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Discord to access your role-based dashboard.
                </p>
              </div>

              {error && (
                <div
                  className="rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm"
                  data-testid="text-auth-error"
                >
                  {error === "no_code" && "Login was cancelled. Please try again."}
                  {error === "token_failed" && "Authentication failed. Please try again."}
                  {error === "user_fetch_failed" && "Could not retrieve your Discord profile. Please try again."}
                  {error === "auth_failed" && "Something went wrong. Please try again."}
                </div>
              )}

              <Button
                size="lg"
                data-testid="button-discord-login"
                className="w-full h-12 sm:h-14 text-base font-semibold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white border-0 shadow-[0_0_20px_rgba(88,101,242,0.2)] hover:shadow-[0_0_28px_rgba(88,101,242,0.35)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
                onClick={handleLogin}
              >
                <SiDiscord className="w-5 h-5 mr-2 shrink-0" />
                Sign In with Discord
              </Button>

              <p className="text-center text-xs text-muted-foreground leading-relaxed">
                Your Discord roles determine your dashboard. Owner and Staff manage operations; Grinder and Elite track orders and performance; Creator manages code and payouts.
              </p>
            </div>
          </div>

          <DevProfiles />
        </motion.div>
      </div>
    </div>
  );
}
