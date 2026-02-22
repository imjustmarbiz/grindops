import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Filter, Clock } from "lucide-react";
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
    if (action.includes("created") || action.includes("accepted") || action.includes("imported")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (action.includes("rejected") || action.includes("denied") || action.includes("strike")) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (action.includes("updated") || action.includes("changed") || action.includes("counter")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-white/10 text-muted-foreground border-white/20";
  };

  const entityColor = (type: string) => {
    switch (type) {
      case "order": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "bid": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "assignment": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "grinder": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-white/10 text-muted-foreground border-white/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-audit-title">
            <ScrollText className="w-8 h-8 text-primary" /> Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">Complete history of all system actions and MGT Bot imports.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px] bg-background/50" data-testid="select-entity-filter">
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

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{filtered.length} entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow>
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
                  <TableRow key={log.id} className="hover:bg-white/[0.02]" data-testid={`row-audit-${log.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={entityColor(log.entityType)}>{log.entityType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionColor(log.action)}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.actor}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(details).slice(0, 4).map(([k, v]) => (
                          <span key={k} className="text-xs bg-white/5 px-1.5 py-0.5 rounded">
                            {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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
