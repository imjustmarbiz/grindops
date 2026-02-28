import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Filter, History, User, Package, Shield, Gavel } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { AuditLog } from "@shared/schema";

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    refetchInterval: 10000,
  });

  const filteredLogs = (logs || []).filter((log) => {
    if (entityFilter !== "all" && log.entityType !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (action.includes("delete") || action.includes("remove")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const entityIcon = (type: string) => {
    if (type === "order") return <Package className="w-3 h-3" />;
    if (type === "grinder") return <User className="w-3 h-3" />;
    if (type === "bid") return <Gavel className="w-3 h-3" />;
    return <Shield className="w-3 h-3" />;
  };

  const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all administrative actions and system events.
            </p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.08]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="grinder">Grinders</SelectItem>
                  <SelectItem value="bid">Bids</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.02] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/[0.08]">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="hidden md:table-cell">Entity ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden sm:table-cell">Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const details = typeof log.details === "string" ? JSON.parse(log.details) : (log.details || {});
                    return (
                      <TableRow key={log.id} className="hover:bg-white/[0.02] border-white/[0.04]">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{format(new Date(log.timestamp), "MMM d, yyyy")}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(log.timestamp), "h:mm:ss a")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-[10px] text-muted-foreground">
                          {log.entityId}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={`text-[10px] w-fit ${actionColor(log.action)}`}>
                              {formatLabel(log.action)}
                            </Badge>
                            <div className="sm:hidden flex items-center gap-1 text-[10px] text-muted-foreground">
                              {entityIcon(log.entityType)}
                              {formatLabel(log.entityType)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{log.actor}</TableCell>
                        <TableCell className="max-w-[200px] sm:max-w-md">
                          <div className="flex flex-col gap-1">
                            {Object.keys(details).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(details).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                                    <span className="text-muted-foreground">{formatLabel(k)}:</span> {String(v)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{log.message}</span>
                            )}
                            <span className="sm:hidden text-[10px] opacity-50">By {log.actor}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-10" />
                      No logs found.
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
