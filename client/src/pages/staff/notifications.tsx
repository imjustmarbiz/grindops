import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Eye, EyeOff, Loader2, CheckCheck, Filter, X } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Notification } from "@shared/schema";

export default function StaffNotifications() {
  const { user } = useAuth();
  const userId = (user as any)?.discordId || user?.id || "";
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filteredNotifications = notifications.filter(n => {
    if (severityFilter !== "all" && n.severity !== severityFilter) return false;
    if (statusFilter === "unread" && isRead(n)) return false;
    if (statusFilter === "read" && !isRead(n)) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !isRead(n)).length;
  const hasFilters = severityFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSeverityFilter("all");
    setStatusFilter("all");
  };

  const markAllRead = () => {
    notifications.filter(n => !isRead(n)).forEach(n => {
      markReadMutation.mutate(n.id);
    });
  };

  const toggleRead = (notif: Notification) => {
    if (!isRead(notif)) {
      markReadMutation.mutate(notif.id);
    }
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

        <FadeInUp delay={0.03}>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white/[0.03] border-white/10" data-testid="filter-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="danger">Danger</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white/[0.03] border-white/10" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredNotifications.length} of {notifications.length} shown
            </span>
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
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-10" data-testid="text-no-notifications">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground/60 text-sm">{hasFilters ? "No notifications match filters" : "No notifications yet"}</p>
                  <p className="text-muted-foreground/40 text-xs mt-1">{hasFilters ? "Try adjusting your filter criteria" : "System alerts and updates will appear here"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notif) => {
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
                        className={`flex items-start gap-3 p-3.5 rounded-lg border ${colors} transition-all duration-200 ${read ? "opacity-50 hover:opacity-70" : "hover:brightness-110"}`}
                        data-testid={`card-notification-${notif.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                            <span className="font-medium text-sm" data-testid={`text-notification-title-${notif.id}`}>{notif.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${colors}`} data-testid={`badge-severity-${notif.id}`}>{notif.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notification-body-${notif.id}`}>{notif.body}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        {!read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => toggleRead(notif)}
                            disabled={markReadMutation.isPending}
                            data-testid={`button-mark-read-${notif.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="shrink-0 h-8 w-8 flex items-center justify-center">
                            <EyeOff className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
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
