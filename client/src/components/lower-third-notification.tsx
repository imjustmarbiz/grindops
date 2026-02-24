import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, AlertTriangle, Bell, DollarSign, Gavel, Info, CheckCircle, Zap, Volume2, VolumeX } from "lucide-react";
import type { Notification } from "@shared/schema";
import { playNotificationSound } from "@/lib/notification-sounds";

const iconMap: Record<string, any> = {
  package: Package,
  "alert-triangle": AlertTriangle,
  bell: Bell,
  "dollar-sign": DollarSign,
  gavel: Gavel,
  info: Info,
  check: CheckCircle,
  zap: Zap,
};

const severityColors: Record<string, string> = {
  info: "border-blue-500/30 bg-blue-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  danger: "border-red-500/30 bg-red-500/10",
};

const severityIconColors: Record<string, string> = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};

export function LowerThirdNotifications() {
  const { user } = useAuth();
  const userId = (user as any)?.discordId || user?.id || "";
  const [visibleNotifs, setVisibleNotifs] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("notif-sound-enabled");
    return stored !== "false";
  });
  const hasInitialized = useRef(false);

  const { data: allNotifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 8000,
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  useEffect(() => {
    const unread = allNotifs.filter(n => {
      const readBy = (n.readBy as string[]) || [];
      return !readBy.includes(userId) && !seenIds.has(n.id);
    });

    if (unread.length > 0) {
      const latest = unread.slice(0, 3);
      setVisibleNotifs(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newOnes = latest.filter(n => !existingIds.has(n.id));
        if (newOnes.length > 0 && soundEnabled && hasInitialized.current) {
          const topNotif = newOnes[0];
          playNotificationSound(topNotif.type || "info");
        }
        return [...prev, ...newOnes].slice(-3);
      });
      setSeenIds(prev => {
        const next = new Set(prev);
        latest.forEach(n => next.add(n.id));
        return next;
      });
    }
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, [allNotifs, userId, seenIds, soundEnabled]);

  const dismiss = useCallback((id: string) => {
    setVisibleNotifs(prev => prev.filter(n => n.id !== id));
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  useEffect(() => {
    if (visibleNotifs.length === 0) return;
    const timers = visibleNotifs.map(n =>
      setTimeout(() => dismiss(n.id), 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [visibleNotifs, dismiss]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem("notif-sound-enabled", String(next));
      return next;
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
      <button
        onClick={toggleSound}
        className="pointer-events-auto self-end mb-1 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
        title={soundEnabled ? "Mute notification sounds" : "Unmute notification sounds"}
        data-testid="button-toggle-notif-sound"
      >
        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence mode="popLayout">
        {visibleNotifs.map(notif => {
          const IconComponent = iconMap[notif.icon || "bell"] || Bell;
          const severity = notif.severity || "info";
          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`pointer-events-auto rounded-xl border ${severityColors[severity]} backdrop-blur-md p-3 pr-8 shadow-lg shadow-black/20 cursor-pointer`}
              onClick={() => dismiss(notif.id)}
              data-testid={`notification-popup-${notif.id}`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-dismiss-notif-${notif.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${severityIconColors[severity]}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-tight">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
