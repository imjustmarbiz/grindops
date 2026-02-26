import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, ExternalLink, Loader2, CheckCheck } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useLocation } from "wouter";

function inferLinkUrl(title: string, body: string): string | null {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("order") && (text.includes("available") || text.includes("open") || text.includes("bidding"))) return "/grinder/orders";
  if (text.includes("bid") && (text.includes("accepted") || text.includes("won"))) return "/grinder/assignments";
  if (text.includes("bid")) return "/grinder/bids";
  if (text.includes("assignment") || text.includes("assigned")) return "/grinder/assignments";
  if (text.includes("payout") || text.includes("payment")) return "/grinder/payouts";
  if (text.includes("strike") || text.includes("warning")) return "/grinder/strikes";
  if (text.includes("review")) return "/grinder/reviews";
  if (text.includes("scorecard") || text.includes("performance")) return "/grinder/scorecard";
  if (text.includes("event")) return "/grinder/events";
  return null;
}

export default function GrinderNotifications() {
  const {
    alerts, systemNotifications, unreadAlertCount, isLoading, isElite,
    markAlertReadMutation, markNotifReadMutation, toast, invalidate,
  } = useGrinderData();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allItems = [
    ...alerts.map((a: any) => ({
      id: a.id,
      kind: "alert" as const,
      title: a.title,
      body: a.message,
      severity: a.severity || "info",
      isRead: a.isRead,
      linkUrl: (a.linkUrl as string | null) || inferLinkUrl(a.title || "", a.message || ""),
      createdAt: a.createdAt,
    })),
    ...systemNotifications.map((n: any) => ({
      id: n.id,
      kind: "notification" as const,
      title: n.title,
      body: n.body,
      severity: n.severity || "info",
      isRead: !!n.isRead,
      linkUrl: (n.linkUrl as string | null) || inferLinkUrl(n.title || "", n.body || ""),
      createdAt: n.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadItems = allItems.filter(i => !i.isRead);

  const handleClick = (item: typeof allItems[0]) => {
    if (!item.isRead) {
      if (item.kind === "alert") {
        markAlertReadMutation.mutate(item.id);
      } else {
        markNotifReadMutation.mutate(item.id);
      }
    }
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const handleMarkAllRead = () => {
    let count = 0;
    for (const item of unreadItems) {
      if (item.kind === "alert") {
        markAlertReadMutation.mutate(item.id);
      } else {
        markNotifReadMutation.mutate(item.id);
      }
      count++;
    }
    if (count > 0) {
      toast({ title: "All caught up", description: `Marked ${count} notification${count > 1 ? "s" : ""} as read.` });
    }
  };

  const severityColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/[0.06] border-blue-500/20",
    warning: "text-yellow-400 bg-yellow-500/[0.06] border-yellow-500/20",
    success: "text-green-400 bg-green-500/[0.06] border-green-500/20",
    danger: "text-red-400 bg-red-500/[0.06] border-red-500/20",
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Bell className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Notifications</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Alerts and messages from staff
                </p>
              </div>
            </div>
            {unreadItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleMarkAllRead}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark All Read
              </Button>
            )}
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
              {allItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">No alerts yet</p>
                  <p className="text-white/25 text-xs mt-1">Staff notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allItems.map((item) => {
                    const colors = severityColors[item.severity] || severityColors.info;
                    return (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border ${colors} cursor-pointer transition-all duration-200 ${item.isRead ? "opacity-50 hover:opacity-70" : "hover:brightness-110"}`}
                        onClick={() => handleClick(item)}
                        data-testid={`card-${item.kind}-${item.id}`}
                      >
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 animate-pulse" />}
                        {item.isRead && <Eye className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{item.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${colors}`}>{item.severity}</Badge>
                            {item.linkUrl && <ExternalLink className="w-3 h-3 text-muted-foreground/60" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-muted-foreground/60">{new Date(item.createdAt).toLocaleString()}</p>
                            {item.linkUrl && !item.isRead && (
                              <span className="text-xs text-blue-400/60">Tap to view</span>
                            )}
                          </div>
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
