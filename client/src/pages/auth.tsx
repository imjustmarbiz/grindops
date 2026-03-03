import { Button } from "@/components/ui/button";
import { Shield, Zap, Target, Crown, Users, Wrench, Gamepad2, BarChart3, ClipboardList, Bell, Megaphone } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { motion } from "framer-motion";
import spLogo from "@assets/image_1771930905137.png";

const isDev = import.meta.env.DEV;

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/auth/discord/login";
  };

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden selection:bg-primary/30 text-foreground">
      <div className="w-full lg:w-1/2 relative hidden lg:flex flex-col p-12 justify-between border-r border-border/50">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            alt="Abstract background" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/50" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src={spLogo} alt="SP Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
            <span className="font-display font-bold text-3xl tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              GrindOps
            </span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="font-display text-5xl font-bold leading-tight mb-6">
              Your complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">operations hub</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
              Role-based dashboards for owners, staff, and grinders. Manage orders, bids, assignments, payouts, and performance -- all in one place.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
          {[
            { icon: ClipboardList, title: "Order Management", desc: "Bidding, assignments & live tracking" },
            { icon: BarChart3, title: "Performance Tracking", desc: "Scorecards, tiers & quality metrics" },
            { icon: Bell, title: "Real-Time Updates", desc: "Discord sync & instant notifications" },
            { icon: Shield, title: "Role-Based Access", desc: "Owner, Staff, Grinder & Elite dashboards" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none lg:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          <div className="flex items-center gap-3 mb-12 lg:hidden justify-center">
            <img src={spLogo} alt="SP Logo" className="w-11 h-11 object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
            <span className="font-display font-bold text-2xl tracking-tight text-white">GrindOps</span>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-display font-bold" data-testid="text-welcome">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in with your Discord account to access the dashboard</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm text-center" data-testid="text-auth-error">
              {error === "no_code" && "Login was cancelled. Please try again."}
              {error === "token_failed" && "Authentication failed. Please try again."}
              {error === "user_fetch_failed" && "Could not retrieve your Discord profile. Please try again."}
              {error === "auth_failed" && "Something went wrong. Please try again."}
            </div>
          )}

          <div className="glass-panel p-8 rounded-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Button 
              size="lg" 
              data-testid="button-discord-login"
              className="w-full h-14 text-base font-semibold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_0_20px_rgba(88,101,242,0.25)] hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] transition-all duration-300 hover:-translate-y-0.5"
              onClick={handleLogin}
            >
              <SiDiscord className="w-5 h-5 mr-2" />
              Sign In with Discord
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Your Discord roles determine your dashboard. Owners and staff manage operations, grinders track orders and performance.
            </p>
          </div>

          {isDev && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dev Profiles</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: "owner", label: "Owner", icon: Crown, color: "from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border-amber-500/30 text-amber-400" },
                  { role: "staff", label: "Staff", icon: Wrench, color: "from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border-blue-500/30 text-blue-400" },
                  { role: "grinder", label: "Grinder", icon: Gamepad2, color: "from-[#5865F2]/20 to-[#5865F2]/10 hover:from-[#5865F2]/30 hover:to-[#5865F2]/20 border-[#5865F2]/30 text-[#5865F2]" },
                  { role: "elite", label: "Elite Grinder", icon: Shield, color: "from-cyan-500/20 to-teal-500/10 hover:from-cyan-500/30 hover:to-teal-500/20 border-cyan-500/30 text-cyan-400" },
                  { role: "creator", label: "DemoCreator", icon: Megaphone, color: "from-emerald-500/20 to-green-600/10 hover:from-emerald-500/30 hover:to-green-600/20 border-emerald-500/30 text-emerald-400" },
                ].map((dev) => (
                  <a
                    key={dev.role}
                    href={`/api/auth/dev/login?role=${dev.role}`}
                    className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${dev.color} border transition-all duration-200 hover:-translate-y-0.5`}
                    data-testid={`link-dev-login-${dev.role}`}
                  >
                    <dev.icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{dev.label}</span>
                  </a>
                ))}
              </div>
              <p className="text-center text-[10px] text-muted-foreground/50">Development only — not visible in production</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
