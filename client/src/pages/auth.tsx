import { Button } from "@/components/ui/button";
import { Activity, Shield, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden selection:bg-primary/30 text-foreground">
      {/* Left Panel - Branding & Features */}
      <div className="w-full lg:w-1/2 relative hidden lg:flex flex-col p-12 justify-between border-r border-border/50">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* landing page hero abstract dark geometry */}
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <Activity className="w-7 h-7 text-white" />
            </div>
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
              The ultimate command center for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Elite Grinders</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
              Manage your MMO service queue, optimize assignments, and track performance with surgical precision.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 mt-12">
          {[
            { icon: Target, title: "Smart Priority", desc: "Algorithmic queue scoring" },
            { icon: Zap, title: "Fast Dispatch", desc: "Instant assignment routing" },
            { icon: Shield, title: "Fair Play", desc: "Balanced utilization tracking" }
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

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none lg:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          {/* Mobile Branding */}
          <div className="flex items-center gap-3 mb-12 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">GrindOps</span>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-display font-bold">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:-translate-y-0.5"
              onClick={handleLogin}
            >
              Sign In with Replit
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to the internal staff policies.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
