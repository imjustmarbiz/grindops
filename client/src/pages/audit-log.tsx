import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Filter, Clock, Activity, FileText, Package, Gavel, Users, Settings, ClipboardCheck, BarChart3, DollarSign, Star, AlertTriangle } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";
import type { AuditLog } from "@shared/schema";
import { formatLabel } from "@/lib/staff-utils";

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs?limit=200"],
    refetchInterval: 30000,
  });

  const entityTypes = ["all", "order", "bid", "assignment", "grinder", "report", "checkpoint", "payout", "payout_request", "order_update", "elite_request", "staff_alert", "config"];
  const filtered = entityFilter === "all" ? (logs || []) : (logs || []).filter(l => l.entityType === entityFilter);

  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort<AuditLog>(filtered, "createdAt", "desc");

  const entityLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: "All Entities",
      order: "Orders",
      bid: "Bids",
      assignment: "Assignments",
      grinder: "Grinders",
      report: "Reports",
      checkpoint: "Checkpoints",
      payout: "Payouts",
      payout_request: "Payout Requests",
      order_update: "Order Updates",
      elite_request: "Elite Requests",
      staff_alert: "Staff Alerts",
      config: "Config",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };

  const actionColor = (action: string) => {
    if (action.includes("created") || action.includes("accepted") || action.includes("imported") || action.includes("generated") || action.includes("approved")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    if (action.includes("rejected") || action.includes("denied") || action.includes("strike") || action.includes("deleted")) return "bg-red-500/15 text-red-400 border-red-500/20";
    if (action.includes("updated") || action.includes("changed") || action.includes("counter") || action.includes("resolved")) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    if (action.includes("checkpoint") || action.includes("login") || action.includes("logoff")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
    if (action.includes("availability") || action.includes("rules") || action.includes("alert_read") || action.includes("acknowledged")) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    return "bg-white/[0.05] text-muted-foreground border-white/10";
  };

  const entityColor = (type: string) => {
    switch (type) {
      case "order": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
      case "bid": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "assignment": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "grinder": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      case "report": return "bg-violet-500/15 text-violet-400 border-violet-500/20";
      case "checkpoint": return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
      case "payout":
      case "payout_request": return "bg-green-500/15 text-green-400 border-green-500/20";
      case "order_update": return "bg-indigo-500/15 text-indigo-400 border-indigo-500/20";
      case "elite_request": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
      case "staff_alert": return "bg-rose-500/15 text-rose-400 border-rose-500/20";
      default: return "bg-white/[0.05] text-muted-foreground border-white/10";
    }
  };

  const entityIcon = (type: string) => {
    switch (type) {
      case "order": return <Package className="w-3 h-3" />;
      case "bid": return <Gavel className="w-3 h-3" />;
      case "assignment": return <FileText className="w-3 h-3" />;
      case "grinder": return <Users className="w-3 h-3" />;
      case "report": return <BarChart3 className="w-3 h-3" />;
      case "checkpoint": return <ClipboardCheck className="w-3 h-3" />;
      case "payout":
      case "payout_request": return <DollarSign className="w-3 h-3" />;
      case "order_update": return <Activity className="w-3 h-3" />;
      case "elite_request": return <Star className="w-3 h-3" />;
      case "staff_alert": return <AlertTriangle className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const summaryCards = [
    { label: "Orders", key: "order", icon: Package, gradient: "from-purple-500/[0.08] via-background to-purple-900/[0.04]", iconBg: "bg-purple-500/15", color: "text-purple-400" },
    { label: "Bids", key: "bid", icon: Gavel, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
    { label: "Assignments", key: "assignment", icon: FileText, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
    { label: "Grinders", key: "grinder", icon: Users, gradient: "from-amber-500/[0.08] via-background to-amber-900/[0.04]", iconBg: "bg-amber-500/15", color: "text-amber-400" },
    { label: "Reports", key: "report", icon: BarChart3, gradient: "from-violet-500/[0.08] via-background to-violet-900/[0.04]", iconBg: "bg-violet-500/15", color: "text-violet-400" },
    { label: "Checkpoints", key: "checkpoint", icon: ClipboardCheck, gradient: "from-cyan-500/[0.08] via-background to-cyan-900/[0.04]", iconBg: "bg-cyan-500/15", color: "text-cyan-400" },
  ];

  return (
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-3" data-testid="text-audit-title">
            <ScrollText className="w-7 h-7 text-primary" />
            Audit Log
            <HelpTip text="Every action in the system is logged here — order edits, bid accepts, payout approvals, strike changes, and more. Use filters to narrow down by entity type or search for specific events." />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Complete history of all system actions, grinder activity, and reports.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px] bg-background/50 border-white/10" data-testid="select-entity-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map(t => (
                <SelectItem key={t} value={t}>
                  {entityLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map(s => {
          const count = (logs || []).filter(l => l.entityType === s.key).length;
          return (
            <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative cursor-pointer transition-all hover:scale-[1.02]`} onClick={() => setEntityFilter(entityFilter === s.key ? "all" : s.key)} data-testid={`card-audit-summary-${s.key}`}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
              <CardContent className="p-4 flex items-center gap-3 relative">
                <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/[0.04]">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {filtered.length} entries
            {entityFilter !== "all" && (
              <Badge variant="outline" className={`border ${entityColor(entityFilter)} gap-1 ml-2`}>
                {entityIcon(entityFilter)}
                {entityLabel(entityFilter)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto overflow-y-hidden">
          <Table className="min-w-full">
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/[0.06]">
                <SortableHeader label="Timestamp" sortKey="createdAt" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                <SortableHeader label="Entity" sortKey="entityType" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="hidden sm:table-cell" />
                <SortableHeader label="Entity ID" sortKey="entityId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="hidden md:table-cell" />
                <SortableHeader label="Action" sortKey="action" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                <SortableHeader label="Actor" sortKey="actor" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="hidden sm:table-cell" />
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : sortedItems.length > 0 ? sortedItems.map((log: AuditLog) => {
                let details: Record<string, any> = {};
                try { details = JSON.parse(log.details || "{}"); } catch {}
                return (
                  <TableRow key={log.id} className="hover:bg-white/[0.03] border-white/[0.04] transition-colors" data-testid={`row-audit-${log.id}`}>
                    <TableCell className="text-[11px] sm:text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <span className="opacity-50 sm:block hidden">•</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={`border ${entityColor(log.entityType)} gap-1 text-[10px] sm:text-xs`}>
                        {entityIcon(log.entityType)}
                        {formatLabel(log.entityType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground hidden md:table-cell">{log.entityId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={`border ${actionColor(log.action)} text-[10px] w-fit`}>
                          {formatLabel(log.action)}
                        </Badge>
                        <div className="sm:hidden flex items-center gap-1 text-[10px] text-muted-foreground">
                          {entityIcon(log.entityType)}
                          {formatLabel(log.entityType)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{log.actor}</TableCell>
                    <TableCell className="max-w-[150px] sm:max-w-[300px]">
                      <div className="flex flex-col gap-0.5">
                        {Object.keys(details).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(details).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-white/[0.04] border border-white/[0.06] px-1 py-0.5 rounded">
                                <span className="text-muted-foreground">{formatLabel(k)}:</span> {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : log.details ? (
                          <span className="text-[11px] sm:text-xs text-muted-foreground truncate" title={log.message}>{log.message}</span>
                        ) : null}
                        <span className="sm:hidden text-[10px] opacity-50 font-medium">By {log.actor}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (                    <TableCell className="hidden sm:table-cell text-sm">{log.actor}</TableCell>
                    <TableCell className="max-w-[150px] sm:max-w-[300px]">
                      <div className="flex flex-col gap-0.5">
                        {Object.keys(details).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(details).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-white/[0.04] border border-white/[0.06] px-1 py-0.5 rounded">
                                <span className="text-muted-foreground">{formatLabel(k)}:</span> {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : log.details ? (
                          <span className="text-[11px] sm:text-xs text-muted-foreground truncate" title={log.message}>{log.message}</span>
                        ) : null}
                        <span className="sm:hidden text-[10px] opacity-50 font-medium">By {log.actor}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No audit logs found{entityFilter !== "all" ? ` for ${entityLabel(entityFilter)}` : ""}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
