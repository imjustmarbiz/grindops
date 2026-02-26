import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, ExternalLink, Loader2, CheckCheck, SlidersHorizontal, X } from "lucide-react";
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

type ReadFilter = "all" | "unread" | "read";
type SeverityFilter = "all" | "info" | "warning" | "success" | "danger";
type KindFilter = "all" | "alert" | "notification";

export default function GrinderNotifications() {
  const {
    alerts, systemNotifications, unreadAlertCount, isLoading, isElite,
    markAlertReadMutation, markNotifReadMutation, toast,
  } = useGrinderData();
  const [, navigate] = useLocation();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

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

  const filteredItems = allItems.filter(item => {
    if (readFilter === "unread" && item.isRead) return false;
    if (readFilter === "read" && !item.isRead) return false;
    if (severityFilter !== "all" && item.severity !== severityFilter) return false;
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    return true;
  });

  const unreadItems = allItems.filter(i => !i.isRead);
  const hasActiveFilters = readFilter !== "all" || severityFilter !== "all" || kindFilter !== "all";
  const activeFilterCount = (readFilter !== "all" ? 1 : 0) + (severityFilter !== "all" ? 1 : 0) + (kindFilter !== "all" ? 1 : 0);

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

  const clearFilters = () => { setReadFilter("all"); setSeverityFilter("all"); setKindFilter("all"); };

  const severityColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/[0.06] border-blue-500/20",
    warning: "text-yellow-400 bg-yellow-500/[0.06] border-yellow-500/20",
    success: "text-green-400 bg-green-500/[0.06] border-green-500/20",
    danger: "text-red-400 bg-red-500/[0.06] border-red-500/20",
  };

  const pill = (active: boolean) =>
    active
      ? `${isElite ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-blue-500/20 text-blue-300 border-blue-500/40"}`
      : "bg-transparent text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground";

  return (
    <AnimatedPage>
      <div className="space-y-4">
        <FadeInUp delay={0}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className={`w-7 h-7 shrink-0 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Notifications</h1>
                <p className="text-muted-foreground text-sm mt-1">Alerts and messages from staff</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 relative ${filtersOpen || hasActiveFilters ? (isElite ? "border-cyan-500/40 text-cyan-400" : "border-blue-500/40 text-blue-400") : ""}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFilterCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isElite ? "bg-cyan-500 text-black" : "bg-blue-500 text-white"}`}>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {unreadItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-8 px-2.5"
                  onClick={handleMarkAllRead}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </Button>
              )}
            </div>
          </div>
        </FadeInUp>

        {filtersOpen && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filters</span>
                <div className="flex items-center gap-1.5">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-5 px-1.5" onClick={clearFilters} data-testid="button-clear-filters">
                      Clear
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground" onClick={() => setFiltersOpen(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">Status</span>
                  {(["all", "unread", "read"] as ReadFilter[]).map(v => (
                    <Button key={v} variant="outline" size="sm" className={`text-[11px] h-6 px-2 rounded-full border ${pill(readFilter === v)}`} onClick={() => setReadFilter(v)} data-testid={`filter-read-${v}`}>
                      {v === "all" ? "All" : v === "unread" ? `Unread${unreadItems.length > 0 ? ` (${unreadItems.length})` : ""}` : "Read"}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">Level</span>
                  {(["all", "info", "warning", "success", "danger"] as SeverityFilter[]).map(v => (
                    <Button key={v} variant="outline" size="sm" className={`text-[11px] h-6 px-2 rounded-full border ${pill(severityFilter === v)}`} onClick={() => setSeverityFilter(v)} data-testid={`filter-severity-${v}`}>
                      {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">Type</span>
                  {(["all", "alert", "notification"] as KindFilter[]).map(v => (
                    <Button key={v} variant="outline" size="sm" className={`text-[11px] h-6 px-2 rounded-full border ${pill(kindFilter === v)}`} onClick={() => setKindFilter(v)} data-testid={`filter-kind-${v}`}>
                      {v === "all" ? "All" : v === "alert" ? "Staff" : "System"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
        )}

        {hasActiveFilters && !filtersOpen && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {readFilter !== "all" && (
              <Badge variant="outline" className={`text-[10px] gap-1 cursor-pointer ${pill(true)}`} onClick={() => setReadFilter("all")}>
                {readFilter} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {severityFilter !== "all" && (
              <Badge variant="outline" className={`text-[10px] gap-1 cursor-pointer ${pill(true)}`} onClick={() => setSeverityFilter("all")}>
                {severityFilter} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {kindFilter !== "all" && (
              <Badge variant="outline" className={`text-[10px] gap-1 cursor-pointer ${pill(true)}`} onClick={() => setKindFilter("all")}>
                {kindFilter === "alert" ? "Staff" : "System"} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}

        <FadeInUp delay={0.03}>
          <Card className={`border-0 bg-gradient-to-br ${unreadAlertCount > 0 ? "from-blue-500/[0.08] via-background to-blue-900/[0.04]" : "from-background to-background"} overflow-hidden relative`} data-testid="card-notifications">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                  <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
                </div>
                Alerts Inbox
                {unreadAlertCount > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 ml-auto text-[10px] sm:text-xs animate-pulse">
                    {unreadAlertCount} unread
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {allItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">No alerts yet</p>
                  <p className="text-white/25 text-xs mt-1">Staff notifications will appear here</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <SlidersHorizontal className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">No matching notifications</p>
                  <p className="text-white/25 text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredItems.map((item) => {
                    const colors = severityColors[item.severity] || severityColors.info;
                    return (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border ${colors} cursor-pointer transition-all duration-200 ${item.isRead ? "opacity-50 hover:opacity-70" : "hover:brightness-110"}`}
                        onClick={() => handleClick(item)}
                        data-testid={`card-${item.kind}-${item.id}`}
                      >
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 animate-pulse" />}
                        {item.isRead && <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-[13px]">{item.title}</span>
                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${colors}`}>{item.severity}</Badge>
                            {item.linkUrl && <ExternalLink className="w-3 h-3 text-muted-foreground/60" />}
                          </div>
                          <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{item.body}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[11px] text-muted-foreground/60">{new Date(item.createdAt).toLocaleString()}</p>
                            {item.linkUrl && !item.isRead && (
                              <span className="text-[11px] text-blue-400/60">Tap to view</span>
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
