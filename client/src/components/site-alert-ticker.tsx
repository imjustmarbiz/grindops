import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { SiteAlert } from "@shared/schema";

export function SiteAlertTicker() {
  const { isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const tickerRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery<SiteAlert[]>({
    queryKey: ["/api/site-alerts"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  useEffect(() => {
    setDismissed(new Set());
  }, [alerts.length]);

  if (visibleAlerts.length === 0) return null;

  const combinedMessage = visibleAlerts.map(a => a.message).join("   •   ");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-auto" data-testid="site-alert-ticker">
      <div className="relative bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 border-t border-amber-500/30 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(245,158,11,0.06)_50%,transparent_100%)] pointer-events-none" />

        <div className="flex items-center h-9 sm:h-10 overflow-hidden">
          <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 border-r border-amber-500/20 h-full bg-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">Alert</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-950/95 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-950/95 to-transparent z-10 pointer-events-none" />
            <div
              ref={tickerRef}
              className="animate-ticker whitespace-nowrap px-8"
              style={{
                animationDuration: `${Math.max(15, combinedMessage.length * 0.15)}s`,
              }}
            >
              <span className="text-xs sm:text-sm font-bold text-amber-100 tracking-wide">
                {combinedMessage}
              </span>
              <span className="inline-block w-[100vw]" />
              <span className="text-xs sm:text-sm font-bold text-amber-100 tracking-wide">
                {combinedMessage}
              </span>
            </div>
          </div>

          {visibleAlerts.length === 1 && (
            <button
              onClick={() => setDismissed(prev => new Set([...prev, visibleAlerts[0].id]))}
              className="shrink-0 px-2 sm:px-3 h-full flex items-center hover:bg-amber-500/10 transition-colors border-l border-amber-500/20"
              data-testid="button-dismiss-alert"
            >
              <X className="w-3.5 h-3.5 text-amber-400/60 hover:text-amber-400" />
            </button>
          )}
          {visibleAlerts.length > 1 && (
            <button
              onClick={() => setDismissed(prev => new Set([...prev, ...visibleAlerts.map(a => a.id)]))}
              className="shrink-0 px-2 sm:px-3 h-full flex items-center hover:bg-amber-500/10 transition-colors border-l border-amber-500/20"
              data-testid="button-dismiss-all-alerts"
            >
              <X className="w-3.5 h-3.5 text-amber-400/60 hover:text-amber-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
