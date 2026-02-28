import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const SESSION_KEY = "grindops-session-id";

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function trackActivity(data: {
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}) {
  apiRequest("POST", "/api/user-activity-logs", {
    ...data,
    sessionId: getSessionId(),
  }).catch(() => {});
}

export function usePageTracker(pageName: string, pageUrl: string) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!user || tracked.current) return;
    tracked.current = true;
    trackActivity({
      action: "page_view",
      category: "navigation",
      targetType: "page",
      targetName: pageName,
      metadata: { url: pageUrl },
    });
  }, [user, pageName, pageUrl]);
}

export function trackUserAction(
  action: string,
  category: string,
  target?: { type?: string; id?: string; name?: string },
  metadata?: Record<string, unknown>,
) {
  trackActivity({
    action,
    category,
    targetType: target?.type,
    targetId: target?.id,
    targetName: target?.name,
    metadata,
  });
}

export function useLoginTracker() {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!user || tracked.current) return;
    const loginKey = `grindops-login-tracked-${user.id}`;
    if (sessionStorage.getItem(loginKey)) {
      tracked.current = true;
      return;
    }
    tracked.current = true;
    sessionStorage.setItem(loginKey, "1");
    trackActivity({
      action: "login",
      category: "auth",
      metadata: { role: (user as any).role },
    });
  }, [user]);
}
