import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Filter, Clock, Activity, FileText, Package, Gavel, Users, Settings } from "lucide-react";
import type { AuditLog } from "@shared/schema";

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs?limit=200"],
    refetchInterval: 10000,
  });

  const entityTypes = ["all", "order", "bid", "assignment", "grinder", "config"];
  const filtered = entityFilter === "all" ? (logs || []) : (logs || []).filter(l => l.entityType === entityFilter);

  const actionColor = (action: string) => {
    if (action.includes("created") || action.includes("accepted") || action.includes("imported")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    if (action.includes("rejected") || action.includes("denied") || action.includes("strike")) return "bg-red-500/15 text-red-400 border-red-500/20";
    if (action.includes("updated") || action.includes("changed") || action.includes("counter")) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    return "bg-white/[0.05] text-muted-foreground border-white/10";
  };

  const entityColor = (type: string) => {
    switch (type) {
      case "order": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
      case "bid": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "assignment": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "grinder": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      default: return "bg-white/[0.05] text-muted-foreground border-white/10";
    }
  };

  const entityIcon = (type: string) => {
    switch (type) {
      case "order": return <Package className="w-3 h-3" />;
      case "bid": return <Gavel className="w-3 h-3" />;
      case "assignment": return <FileText className="w-3 h-3" />;
      case "grinder": return <Users className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const orderCount = (logs || []).filter(l => l.entityType === "order").length;
  const bidCount = (logs || []).filter(l => l.entityType === "bid").length;
  const assignmentCount = (logs || []).filter(l => l.entityType === "assignment").length;
  const grinderCount = (logs || []).filter(l => l.entityType === "grinder").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-3" data-testid="text-audit-title">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Complete history of all system actions and MGT Bot imports.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px] bg-background/50 border-white/10" data-testid="select-entity-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map(t => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All Entities" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Orders", value: orderCount, icon: Package, gradient: "from-purple-500/[0.08] via-background to-purple-900/[0.04]", iconBg: "bg-purple-500/15", color: "text-purple-400" },
          { label: "Bids", value: bidCount, icon: Gavel, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
          { label: "Assignments", value: assignmentCount, icon: FileText, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
          { label: "Grinders", value: grinderCount, icon: Users, gradient: "from-amber-500/[0.08] via-background to-amber-900/[0.04]", iconBg: "bg-amber-500/15", color: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4 flex items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/[0.04]">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {filtered.length} entries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/[0.06]">
                <TableHead>Timestamp</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map((log: AuditLog) => {
                let details: Record<string, any> = {};
                try { details = JSON.parse(log.details || "{}"); } catch {}
                return (
                  <TableRow key={log.id} className="hover:bg-white/[0.03] border-white/[0.04] transition-colors" data-testid={`row-audit-${log.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-50" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border ${entityColor(log.entityType)} gap-1`}>
                        {entityIcon(log.entityType)}
                        {log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border ${actionColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.actor}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(details).slice(0, 4).map(([k, v]) => (
                          <span key={k} className="text-xs bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md">
                            <span className="text-muted-foreground">{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No audit logs yet. Actions are logged as MGT Bot processes orders and proposals.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
