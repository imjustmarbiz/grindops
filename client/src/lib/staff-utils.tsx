import { Crown, Zap, Shield, Users, ArrowRight, Clock, Target, Timer, CheckCircle, AlertTriangle } from "lucide-react";

export function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export function formatCompact(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

export function AnimatedRing({ percent, size = 80, stroke = 8, color, label, value }: { percent: number; size?: number; stroke?: number; color: string; label: string; value: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/5" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

export function MultiSegmentRing({ segments, size = 80, stroke = 8, label, value }: { segments: { percent: number; color: string }[]; size?: number; stroke?: number; label: string; value: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/5" />
          {segments.map((seg, i) => {
            const segLen = (Math.min(seg.percent, 100) / 100) * circumference;
            const segOffset = circumference - segLen;
            const rotation = (accumulated / 100) * 360;
            accumulated += seg.percent;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={0}
                strokeLinecap="butt"
                className="transition-all duration-1000 ease-out"
                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

export function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-xs text-muted-foreground w-16 truncate">{label}</span>}
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value}</span>
    </div>
  );
}

export function PipelineStep({ label, count, total, color, icon: Icon, isLast, hideArrow }: { label: string; count: number; total: number; color: string; icon: any; isLast?: boolean; hideArrow?: boolean }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
  return (
    <>
      <div className={`flex flex-col items-center p-3 rounded-xl border ${color} transition-all hover:scale-[1.02]`} data-testid={`pipeline-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-[10px] opacity-50">{pct}%</span>
      </div>
      {!isLast && <ArrowRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${hideArrow ? "hidden lg:block" : ""}`} />}
    </>
  );
}

export function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(date);
  return (
    <span className="text-[10px] text-muted-foreground font-mono" data-testid="text-last-updated">
      Last updated {fmt}
    </span>
  );
}

export function categoryIcon(cat: string) {
  if (cat === "Elite Grinder") return <Crown className="w-3 h-3 text-yellow-500" />;
  if (cat === "VC Grinder") return <Zap className="w-3 h-3 text-cyan-400" />;
  if (cat === "Event Grinder") return <Shield className="w-3 h-3 text-purple-400" />;
  return <Users className="w-3 h-3 text-primary" />;
}
