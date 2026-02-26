import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, X } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { SiteAlert } from "@shared/schema";

const DISMISSED_KEY = "dismissed-site-alerts";

function getDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function persistDismissed(ids: Set<string>) {
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function SiteAlertTicker() {
  const { isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);
  const barRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery<SiteAlert[]>({
    queryKey: ["/api/site-alerts"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const dismissAll = useCallback(() => {
    const next = new Set([...dismissed, ...alerts.map(a => a.id)]);
    setDismissed(next);
    persistDismissed(next);
  }, [dismissed, alerts]);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  useEffect(() => {
    const el = barRef.current;
    if (!el || visibleAlerts.length === 0) {
      document.documentElement.style.setProperty("--alert-bar-h", "0px");
      return;
    }
    const sync = () => {
      document.documentElement.style.setProperty("--alert-bar-h", `${el.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.setProperty("--alert-bar-h", "0px"); };
  }, [visibleAlerts.length]);

  if (visibleAlerts.length === 0) return null;

  const combinedMessage = visibleAlerts.map(a => a.message).join("   •   ");

  return (
    <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-auto" data-testid="site-alert-ticker">
      <div className="relative border-t border-primary/30 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.4)] bg-[hsl(var(--background)/0.95)]">
        <div className="absolute inset-0 bg-primary/[0.06] pointer-events-none" />

        <div className="sm:hidden flex items-start gap-0 relative">
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 border-r border-primary/20 bg-primary/10 self-stretch">
            <AlertTriangle className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 px-2.5 py-2">
            <p className="text-[11px] font-bold text-foreground leading-snug" data-testid="text-alert-message-mobile">
              {combinedMessage}
            </p>
          </div>
          <button
            onClick={dismissAll}
            className="shrink-0 px-2 py-2 self-stretch flex items-start pt-2 hover:bg-primary/10 transition-colors border-l border-primary/20"
            data-testid="button-dismiss-alert"
          >
            <X className="w-3.5 h-3.5 text-primary/60" />
          </button>
        </div>

        <div className="hidden sm:flex items-center h-10">
          <div className="shrink-0 flex items-center gap-1.5 px-4 border-r border-primary/20 h-full bg-primary/10">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Alert</span>
          </div>
          <div className="flex-1 min-w-0 px-4 flex items-center justify-center">
            <p className="text-sm font-bold text-foreground tracking-wide truncate text-center" data-testid="text-alert-message">
              {combinedMessage}
            </p>
          </div>
          <button
            onClick={dismissAll}
            className="shrink-0 px-3 h-full flex items-center hover:bg-primary/10 transition-colors border-l border-primary/20"
            data-testid="button-dismiss-alert-desktop"
          >
            <X className="w-3.5 h-3.5 text-primary/60 hover:text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}
