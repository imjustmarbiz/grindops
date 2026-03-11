import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Notification } from "@shared/schema";

const GRADIENT = "bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent";
const BORDER = "border-pink-500/20 border-purple-500/20";

export default function CustomerNotifications() {
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

  const filtered = notifications.filter((n) => {
    if (statusFilter === "unread" && isRead(n)) return false;
    if (statusFilter === "read" && !isRead(n)) return false;
    return true;
  });
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border ${BORDER} p-5 sm:p-6 ${GRADIENT}`}>
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  Notifications
                </h1>
                <p className="text-sm text-white/60 mt-0.5">
                  Order updates and important announcements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {unreadCount} unread
                </Badge>
              )}
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                <Button variant={statusFilter === "all" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter("all")}>All</Button>
                <Button variant={statusFilter === "unread" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter("unread")}>Unread</Button>
                <Button variant={statusFilter === "read" ? "secondary" : "ghost"} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter("read")}>Read</Button>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No notifications</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start justify-between gap-4 ${!isRead(n) ? "bg-pink-500/5" : ""}`}
                  >
                    <div>
                      <p className="font-medium text-white">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-2">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!isRead(n) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-pink-500/30 text-pink-400"
                        onClick={() => markReadMutation.mutate(n.id)}
                        disabled={markReadMutation.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
