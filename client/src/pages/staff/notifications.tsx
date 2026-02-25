import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, Loader2, CheckCheck } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Notification } from "@shared/schema";

export default function StaffNotifications() {
  const { user } = useAuth();
  const userId = (user as any)?.discordId || user?.id || "";

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const isRead = (n: Notification) => {
    const readBy = (n.readBy as string[]) || [];
    return readBy.includes(userId);
  };

  const unreadCount = notifications.filter(n => !isRead(n)).length;

  const markAllRead = () => {
    notifications.filter(n => !isRead(n)).forEach(n => {
      markReadMutation.mutate(n.id);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-notifications">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">Notifications</h1>
              <p className="text-sm text-muted-foreground mt-1">System alerts and updates</p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-2"
                onClick={markAllRead}
                disabled={markReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <Card className={`border-0 bg-gradient-to-br ${unreadCount > 0 ? "from-primary/[0.08] via-background to-primary/[0.04]" : "from-background to-background"} overflow-hidden relative`} data-testid="card-notifications">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                Alerts Inbox
                {unreadCount > 0 && (
                  <Badge className="bg-primary/20 text-primary border-0 ml-auto text-xs animate-pulse" data-testid="badge-unread-count">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-10" data-testid="text-no-notifications">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground/60 text-sm">No notifications yet</p>
                  <p className="text-muted-foreground/40 text-xs mt-1">System alerts and updates will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => {
                    const read = isRead(notif);
                    const severityColors: Record<string, string> = {
                      info: "text-blue-400 bg-blue-500/[0.06] border-blue-500/20",
                      warning: "text-yellow-400 bg-yellow-500/[0.06] border-yellow-500/20",
                      success: "text-green-400 bg-green-500/[0.06] border-green-500/20",
                      danger: "text-red-400 bg-red-500/[0.06] border-red-500/20",
                    };
                    const colors = severityColors[notif.severity] || severityColors.info;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border ${colors} cursor-pointer transition-all duration-200 ${read ? "opacity-50 hover:opacity-70" : "hover:brightness-110"}`}
                        onClick={() => { if (!read) markReadMutation.mutate(notif.id); }}
                        data-testid={`card-notification-${notif.id}`}
                      >
                        {!read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />}
                        {read && <Eye className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm" data-testid={`text-notification-title-${notif.id}`}>{notif.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${colors}`} data-testid={`badge-severity-${notif.id}`}>{notif.severity}</Badge>
                            {notif.type && notif.type !== notif.severity && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/20" data-testid={`badge-type-${notif.id}`}>{notif.type}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notification-body-${notif.id}`}>{notif.body}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      </div>
    </AnimatedPage>
  );
}