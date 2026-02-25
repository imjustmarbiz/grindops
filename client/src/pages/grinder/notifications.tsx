import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Eye, Loader2 } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function GrinderNotifications() {
  const {
    alerts, unreadAlertCount, isLoading, isElite,
    markAlertReadMutation,
  } = useGrinderData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center gap-3">
            <Bell className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Notifications</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Alerts and messages from staff
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <Card className={`border-0 bg-gradient-to-br ${unreadAlertCount > 0 ? "from-blue-500/[0.08] via-background to-blue-900/[0.04]" : "from-background to-background"} overflow-hidden relative`} data-testid="card-notifications">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                  <Bell className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
                </div>
                Alerts Inbox
                {unreadAlertCount > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 ml-auto text-xs animate-pulse">
                    {unreadAlertCount} unread
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">No alerts yet</p>
                  <p className="text-white/25 text-xs mt-1">Staff notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert: any) => {
                    const severityColors: Record<string, string> = {
                      info: "text-blue-400 bg-blue-500/[0.06] border-blue-500/20",
                      warning: "text-yellow-400 bg-yellow-500/[0.06] border-yellow-500/20",
                      success: "text-green-400 bg-green-500/[0.06] border-green-500/20",
                      danger: "text-red-400 bg-red-500/[0.06] border-red-500/20",
                    };
                    const colors = severityColors[alert.severity] || severityColors.info;
                    return (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border ${colors} cursor-pointer transition-all duration-200 ${alert.isRead ? "opacity-50 hover:opacity-70" : "hover:brightness-110"}`}
                        onClick={() => { if (!alert.isRead) markAlertReadMutation.mutate(alert.id); }}
                        data-testid={`card-alert-${alert.id}`}
                      >
                        {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 animate-pulse" />}
                        {alert.isRead && <Eye className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{alert.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${colors}`}>{alert.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5">{new Date(alert.createdAt).toLocaleString()}</p>
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
