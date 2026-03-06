import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Notification } from "@shared/schema";

const CARD_GRADIENT = "border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative shadow-xl shadow-black/20";
const ICON_BG = "bg-emerald-500/15";
const ACCENT_TEXT = "text-emerald-400";

export default function CreatorNotifications() {
  const { user } = useAuth();
  const userId = (user as any)?.discordId || user?.id || "";
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const isRead = (n: Notification) => {
    const readBy = (n.readBy as string[]) || [];
    return readBy.includes(userId);
  };

  const filtered = notifications.filter(n => {
    if (statusFilter === "unread" && isRead(n)) return false;
    if (statusFilter === "read" && !isRead(n)) return false;
    return true;
  });
  const unreadCount = notifications.filter(n => !isRead(n)).length;
  const readCount = notifications.length - unreadCount;

  if (isLoading) {
    return (
      <AnimatedPage className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      {/* Hero */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <Bell className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                  Notifications
                </h1>
                <p className="text-sm text-white/80 mt-0.5">
                  Site and staff updates for creators. Mark as read when you’re done.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                  {unreadCount} unread
                </Badge>
              )}
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                <Button variant={statusFilter === "all" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs border-0 rounded-md" onClick={() => setStatusFilter("all")}>All</Button>
                <Button variant={statusFilter === "unread" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs border-0 rounded-md" onClick={() => setStatusFilter("unread")}>
                  Unread {unreadCount > 0 && <span className="ml-1 text-[10px] opacity-80">({unreadCount})</span>}
                </Button>
                <Button variant={statusFilter === "read" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs border-0 rounded-md" onClick={() => setStatusFilter("read")}>Read</Button>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Summary cards */}
      <FadeInUp>
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 overflow-hidden bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight mt-0.5">{notifications.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 overflow-hidden bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">Unread</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight mt-0.5">{unreadCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 overflow-hidden bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-blue-400/80">Read</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400 tracking-tight mt-0.5">{readCount}</p>
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      {/* Inbox */}
      <FadeInUp>
        <Card className={CARD_GRADIENT}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Inbox
              {filtered.length > 0 && (
                <span className="text-xs font-normal text-white/50">— {filtered.length} shown</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-sm text-white/70">No notifications</p>
                <p className="text-xs text-white/50 mt-1">{statusFilter === "all" ? "Staff and system updates will appear here." : "Try another filter."}</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {filtered.map((n) => (
                  <li
                    key={n.id}
                    className={`p-4 flex items-start gap-3 ${!isRead(n) ? "bg-emerald-500/[0.06]" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white/90">{n.title || "Notification"}</p>
                      <p className="text-xs text-white/60 mt-0.5">{n.body}</p>
                    </div>
                    {!isRead(n) && (
                      <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => markReadMutation.mutate(n.id)}>
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
