import { Shield, Crown, Wrench, Gamepad2, Star } from "lucide-react";
import { motion } from "framer-motion";

function isDevEnvironment(): boolean {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".replit.dev");
}

export default function DevProfilesPanel() {
  if (!isDevEnvironment()) return null;

  return (
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
          { role: "owner", label: "Owner", icon: Crown, color: "from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/15 border-primary/30 text-primary" },
          { role: "staff", label: "Staff", icon: Wrench, color: "from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border-blue-500/30 text-blue-400" },
          { role: "grinder", label: "Grinder", icon: Gamepad2, color: "from-[#5865F2]/20 to-[#5865F2]/10 hover:from-[#5865F2]/30 hover:to-[#5865F2]/20 border-[#5865F2]/30 text-[#5865F2]" },
          { role: "elite", label: "Elite Grinder", icon: Shield, color: "from-cyan-500/20 to-teal-500/10 hover:from-cyan-500/30 hover:to-teal-500/20 border-cyan-500/30 text-cyan-400" },
          { role: "creator", label: "Creator", icon: Star, color: "from-emerald-500/20 to-green-600/10 hover:from-emerald-500/30 hover:to-green-600/20 border-emerald-500/30 text-emerald-400" },
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
  );
}
