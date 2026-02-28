import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Search, User, Monitor, MousePointer, LogIn, Eye, Filter, Clock } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";
import type { UserActivityLog } from "@shared/schema";

const categoryColors: Record<string, string> = {
  navigation: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  auth: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  order: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  bid: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  assignment: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  payout: "bg-green-500/15 text-green-400 border-green-500/20",
  grinder: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  admin: "bg-red-500/15 text-red-400 border-red-500/20",
  settings: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const actionIcons: Record<string, typeof Activity> = {
  page_view: Eye,
  login: LogIn,
  click: MousePointer,
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityLogPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery<UserActivityLog[]>({
    queryKey: ["/api/user-activity-logs?limit=500"],
    refetchInterval: 15000,
  });

  const allLogs = logs || [];

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    allLogs.forEach(l => map.set(l.userId, l.userName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allLogs]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(allLogs.map(l => l.category))).sort();
  }, [allLogs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(allLogs.map(l => l.action))).sort();
  }, [allLogs]);

  const filtered = useMemo(() => {
    return allLogs.filter(l => {
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (userFilter && !l.userName.toLowerCase().includes(userFilter.toLowerCase()) && !l.userId.includes(userFilter)) return false;
      return true;
    });
  }, [allLogs, categoryFilter, actionFilter, userFilter]);

  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort<UserActivityLog>(filtered, "createdAt", "desc");

  const stats = useMemo(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent = allLogs.filter(l => new Date(l.createdAt) > last24h);
    const uniqueUsersToday = new Set(recent.map(l => l.userId)).size;
    const pageViews = recent.filter(l => l.action === "page_view").length;
    const logins = recent.filter(l => l.action === "login").length;
    return { total: recent.length, uniqueUsersToday, pageViews, logins };
  }, [allLogs]);

  const roleColor = (role: string) => {
    if (role === "owner") return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    if (role === "staff") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    if (role === "grinder") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    return "bg-white/[0.05] text-muted-foreground border-white/10";
  };

  return (
    <AnimatedPage>
      <div className="space-y-6" data-testid="page-activity-log">
        <FadeInUp>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-7 h-7 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">User Activity Log</h1>
                <p className="text-sm text-muted-foreground">Track user sessions, page visits, and actions across the platform</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-muted-foreground" data-testid="text-total-count">
              {allLogs.length} entries
            </Badge>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>24h Activity</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-stat-total">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Active Users</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-stat-users">{stats.uniqueUsersToday}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Page Views</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-stat-pageviews">{stats.pageViews}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Logins</span>
                </div>
                <p className="text-xl font-bold" data-testid="text-stat-logins">{stats.logins}</p>
              </CardContent>
            </Card>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <Card className="bg-card/50 border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  Filters
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search user..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="pl-8 h-9 w-44 bg-background/50 text-sm"
                      data-testid="input-user-filter"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-36 h-9 bg-background/50 text-sm" data-testid="select-category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-36 h-9 bg-background/50 text-sm" data-testid="select-action-filter">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {uniqueActions.map(a => (
                        <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Activity className="w-5 h-5 animate-spin mr-2" />
                  Loading activity logs...
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Monitor className="w-8 h-8 opacity-50" />
                  <p className="text-sm">No activity logs found</p>
                  <p className="text-xs">User actions will appear here as they happen</p>
                </div>
              ) : (
                <>
                  <div className="md:hidden space-y-3 p-4">
                    {sortedItems.map((log) => {
                      const IconComponent = actionIcons[log.action] || Activity;
                      const meta = log.metadata ? (() => { try { return JSON.parse(log.metadata); } catch { return null; } })() : null;
                      const detailText = meta?.url || (meta?.role ? `Role: ${meta.role}` : (log.metadata ? log.metadata.slice(0, 80) : ""));
                      return (
                        <Card
                          key={log.id}
                          className="border-white/[0.06] bg-white/[0.02]"
                          data-testid={`card-activity-mobile-${log.id}`}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium" data-testid={`text-user-mobile-${log.id}`}>{log.userName}</span>
                                <Badge variant="outline" className={`text-[10px] ${roleColor(log.userRole)}`}>
                                  {log.userRole}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(new Date(log.createdAt))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <IconComponent className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs">{log.action.replace(/_/g, " ")}</span>
                              </div>
                              <Badge variant="outline" className={`text-[10px] ${categoryColors[log.category] || "bg-white/[0.05] text-muted-foreground border-white/10"}`}>
                                {log.category}
                              </Badge>
                            </div>
                            {(log.targetName || log.targetId) && (
                              <div className="text-xs text-muted-foreground">
                                {log.targetName || (
                                  <code className="text-[10px] bg-white/[0.05] px-1 rounded">{log.targetId}</code>
                                )}
                              </div>
                            )}
                            {detailText && (
                              <p className="text-[10px] text-muted-foreground truncate">{detailText}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.06] hover:bg-transparent">
                          <SortableHeader label="Time" sortKey="createdAt" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                          <SortableHeader label="User" sortKey="userName" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                          <TableHead className="text-xs">Role</TableHead>
                          <SortableHeader label="Action" sortKey="action" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                          <SortableHeader label="Category" sortKey="category" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                          <TableHead className="text-xs">Target</TableHead>
                          <TableHead className="text-xs">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedItems.map((log) => {
                          const IconComponent = actionIcons[log.action] || Activity;
                          const meta = log.metadata ? (() => { try { return JSON.parse(log.metadata); } catch { return null; } })() : null;
                          return (
                            <TableRow key={log.id} className="border-white/[0.06]" data-testid={`row-activity-${log.id}`}>
                              <TableCell className="text-xs whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(new Date(log.createdAt))}
                                </div>
                                <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                  {new Date(log.createdAt).toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium" data-testid={`text-user-${log.id}`}>{log.userName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] ${roleColor(log.userRole)}`} data-testid={`badge-role-${log.id}`}>
                                  {log.userRole}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <IconComponent className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs">{log.action.replace(/_/g, " ")}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] ${categoryColors[log.category] || "bg-white/[0.05] text-muted-foreground border-white/10"}`}>
                                  {log.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {log.targetName && (
                                  <span className="text-muted-foreground">{log.targetName}</span>
                                )}
                                {log.targetId && !log.targetName && (
                                  <code className="text-[10px] bg-white/[0.05] px-1 rounded">{log.targetId}</code>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {meta?.url && <span>{meta.url}</span>}
                                {meta?.role && !meta.url && <span>Role: {meta.role}</span>}
                                {!meta && log.metadata && <span className="text-[10px]">{log.metadata.slice(0, 60)}</span>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      </div>
    </AnimatedPage>
  );
}
