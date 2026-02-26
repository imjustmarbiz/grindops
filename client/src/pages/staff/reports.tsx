import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, Activity, MessageSquare, Loader2, CheckCircle, Filter,
  Plus, Clock, AlertTriangle, Eye, Trash2, Pencil, FileBarChart,
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function StaffReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    grinders: allGrinders,
    assignments: allAssignments,
    analyticsLoading,
  } = useStaffData();

  const [activeTab, setActiveTab] = useState<"reports" | "checkpoints" | "updates">("reports");

  const reports = useQuery<any[]>({ queryKey: ["/api/staff/performance-reports"], refetchInterval: 30000 });
  const checkpoints = useQuery<any[]>({ queryKey: ["/api/staff/checkpoints"], refetchInterval: 30000 });
  const orderUpdates = useQuery<any[]>({ queryKey: ["/api/staff/order-updates"], refetchInterval: 30000 });

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateAssignmentId, setGenerateAssignmentId] = useState("");

  const [staffNotesMap, setStaffNotesMap] = useState<Record<string, string>>({});

  const [checkpointFilter, setCheckpointFilter] = useState("all");

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveCheckpointId, setResolveCheckpointId] = useState("");
  const [resolveNote, setResolveNote] = useState("");

  const [editTimeDialogOpen, setEditTimeDialogOpen] = useState(false);
  const [editTimeCheckpointId, setEditTimeCheckpointId] = useState("");
  const [editTimeValue, setEditTimeValue] = useState("");

  const generateReportMutation = useMutation({
    mutationFn: async (data: { assignmentId: string }) => {
      const res = await apiRequest("POST", "/api/staff/performance-reports/generate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/performance-reports"] });
      setGenerateDialogOpen(false);
      setGenerateAssignmentId("");
      toast({ title: "Report generated", description: "Performance report has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to generate report", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const approveReportMutation = useMutation({
    mutationFn: async ({ id, staffNotes }: { id: string; staffNotes: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/performance-reports/${id}`, { status: "Approved", staffNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/performance-reports"] });
      toast({ title: "Report approved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to approve report", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/staff/performance-reports/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/performance-reports"] });
      toast({ title: "Report deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete report", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const resolveCheckpointMutation = useMutation({
    mutationFn: async ({ id, resolvedBy, resolvedNote }: { id: string; resolvedBy: string; resolvedNote: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/checkpoints/${id}/resolve`, { resolvedBy, resolvedNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/checkpoints"] });
      setResolveDialogOpen(false);
      setResolveCheckpointId("");
      setResolveNote("");
      toast({ title: "Checkpoint resolved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to resolve checkpoint", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const editTimeMutation = useMutation({
    mutationFn: async ({ id, createdAt }: { id: string; createdAt: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/checkpoints/${id}/edit-time`, { createdAt });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/checkpoints"] });
      setEditTimeDialogOpen(false);
      setEditTimeCheckpointId("");
      setEditTimeValue("");
      toast({ title: "Checkpoint time updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update time", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const acknowledgeUpdateMutation = useMutation({
    mutationFn: async ({ id, acknowledgedBy }: { id: string; acknowledgedBy: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/order-updates/${id}/acknowledge`, { acknowledgedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/order-updates"] });
      toast({ title: "Update acknowledged" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to acknowledge update", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const getGrinderName = (grinderId: string) => {
    const g = allGrinders.find(gr => gr.id === grinderId);
    return g?.name || grinderId;
  };

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const reportsList = reports.data || [];
  const checkpointsList = checkpoints.data || [];
  const updatesList = orderUpdates.data || [];

  const filteredCheckpoints = checkpointFilter === "all"
    ? checkpointsList
    : checkpointsList.filter((c: any) => c.type === checkpointFilter);

  const tabs = [
    { id: "reports" as const, label: "Performance Reports", icon: FileText, count: reportsList.length },
    { id: "checkpoints" as const, label: "Activity Checkpoints", icon: Activity, count: checkpointsList.length },
    { id: "updates" as const, label: "Order Updates", icon: MessageSquare, count: updatesList.length },
  ];

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileBarChart className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">
                Reports & Monitoring
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Performance reports, activity checkpoints, and order updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-500/15 text-violet-400 border border-violet-500/20 gap-1">
              <FileText className="w-3 h-3" />
              {reportsList.length} reports
            </Badge>
            <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 gap-1">
              <Activity className="w-3 h-3" />
              {checkpointsList.length} checkpoints
            </Badge>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit max-w-full overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
            <Badge variant="outline" className="text-[10px] ml-1">{tab.count}</Badge>
          </button>
        ))}
      </div>
      </FadeInUp>

      {activeTab === "reports" && (
        <FadeInUp>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance Reports</span>
            <Button
              data-testid="button-generate-report"
              className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => setGenerateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {reports.isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!reports.isLoading && reportsList.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]">
              No performance reports yet. Generate one to get started.
            </div>
          )}

          {reportsList.map((report: any) => {
            const currentNotes = staffNotesMap[report.id] ?? (report.staffNotes || "");
            const metrics = report.metricsSnapshot || {};
            const checkpointSummary = report.checkpointSummary || {};

            return (
              <Card key={report.id} className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-background to-violet-900/[0.04] overflow-hidden relative" data-testid={`card-report-${report.id}`}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-400" />
                    </div>
                    <span data-testid={`text-report-grinder-${report.id}`}>{getGrinderName(report.grinderId)}</span>
                    <span className="text-xs text-muted-foreground">#{report.assignmentId}</span>
                    <Badge className={`ml-auto ${report.status === "Approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"}`} data-testid={`badge-report-status-${report.id}`}>
                      {report.status}
                    </Badge>
                    {report.overallGrade && (
                      <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20" data-testid={`badge-report-grade-${report.id}`}>
                        {report.overallGrade}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    <div className="p-2 rounded-lg bg-white/[0.03]" data-testid={`metric-quality-${report.id}`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</div>
                      <div className="text-sm font-semibold text-violet-400">{metrics.qualityScore ?? "—"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]" data-testid={`metric-completion-${report.id}`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Completion</div>
                      <div className="text-sm font-semibold text-emerald-400">{metrics.completionRate != null ? `${metrics.completionRate}%` : "—"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]" data-testid={`metric-winrate-${report.id}`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</div>
                      <div className="text-sm font-semibold text-blue-400">{metrics.winRate != null ? `${metrics.winRate}%` : "—"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]" data-testid={`metric-ontime-${report.id}`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">On-Time</div>
                      <div className="text-sm font-semibold text-cyan-400">{metrics.onTimeRate != null ? `${metrics.onTimeRate}%` : "—"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]" data-testid={`metric-compliance-${report.id}`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Updates</div>
                      <div className="text-sm font-semibold text-amber-400">{report.dailyUpdateCompliance != null ? `${report.dailyUpdateCompliance}%` : "—"}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Checkpoint Summary</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div data-testid={`checkpoint-acks-${report.id}`}>
                        <span className="text-muted-foreground">Ticket Asks: </span>
                        <span className="font-medium">{checkpointSummary.ticketAcks ?? 0}</span>
                      </div>
                      <div data-testid={`checkpoint-logins-${report.id}`}>
                        <span className="text-muted-foreground">Logins: </span>
                        <span className="font-medium">{checkpointSummary.logins ?? 0}</span>
                      </div>
                      <div data-testid={`checkpoint-issues-reported-${report.id}`}>
                        <span className="text-muted-foreground">Issues: </span>
                        <span className="font-medium">{checkpointSummary.issuesReported ?? 0}/{checkpointSummary.issuesResolved ?? 0}</span>
                      </div>
                      <div data-testid={`checkpoint-updates-${report.id}`}>
                        <span className="text-muted-foreground">Updates: </span>
                        <span className="font-medium">{checkpointSummary.updatesSubmitted ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Staff Notes</label>
                    <Textarea
                      value={currentNotes}
                      onChange={(e) => setStaffNotesMap(prev => ({ ...prev, [report.id]: e.target.value }))}
                      disabled={report.status === "Approved"}
                      placeholder="Add staff notes..."
                      className="resize-none bg-background/50 border-white/10 min-h-[60px]"
                      data-testid={`textarea-staff-notes-${report.id}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {report.status === "Draft" && (
                      <Button
                        data-testid={`button-approve-report-${report.id}`}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
                        disabled={approveReportMutation.isPending}
                        onClick={() => approveReportMutation.mutate({ id: report.id, staffNotes: currentNotes })}
                      >
                        {approveReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve Report
                      </Button>
                    )}
                    <Button
                      data-testid={`button-delete-report-${report.id}`}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      disabled={deleteReportMutation.isPending}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this report?")) {
                          deleteReportMutation.mutate(report.id);
                        }
                      }}
                    >
                      {deleteReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Performance Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-xs text-muted-foreground font-medium">Select Assignment</label>
                <Select value={generateAssignmentId} onValueChange={setGenerateAssignmentId}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-generate-assignment">
                    <SelectValue placeholder="Choose an assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAssignments.map((a: any) => {
                      const grinderName = getGrinderName(a.grinderId);
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          {a.id} — {grinderName} ({a.status})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} data-testid="button-cancel-generate">
                  Cancel
                </Button>
                <Button
                  data-testid="button-confirm-generate"
                  className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white"
                  disabled={!generateAssignmentId || generateReportMutation.isPending}
                  onClick={() => generateReportMutation.mutate({ assignmentId: generateAssignmentId })}
                >
                  {generateReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </FadeInUp>
      )}

      {activeTab === "checkpoints" && (
        <FadeInUp>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity Checkpoints</span>
            <Select value={checkpointFilter} onValueChange={setCheckpointFilter}>
              <SelectTrigger className="w-44 bg-background/50 border-white/10" data-testid="select-checkpoint-filter">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ticket_ack">Ticket Ask</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logoff">Logoff</SelectItem>
                <SelectItem value="start_order">Start Order</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="order_update">Order Update</SelectItem>
                <SelectItem value="missed_update">Missed Update</SelectItem>
                <SelectItem value="stream_live">Stream Live</SelectItem>
                <SelectItem value="stream_offline">Stream Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {checkpoints.isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!checkpoints.isLoading && filteredCheckpoints.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]">
              No checkpoints found.
            </div>
          )}

          <div className="space-y-2">
            {filteredCheckpoints.map((cp: any) => {
              const isUnresolvedIssue = cp.type === "issue" && !cp.resolvedAt;
              const typeColors: Record<string, string> = {
                ticket_ack: "bg-blue-500/15 text-blue-400 border-blue-500/20",
                login: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
                logoff: "bg-slate-500/15 text-slate-400 border-slate-500/20",
                start_order: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
                issue: "bg-red-500/15 text-red-400 border-red-500/20",
                order_update: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
                missed_update: "bg-amber-500/15 text-amber-400 border-amber-500/20",
                stream_live: "bg-red-500/15 text-red-400 border-red-500/20",
                stream_offline: "bg-slate-500/15 text-slate-400 border-slate-500/20",
              };

              return (
                <div key={cp.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]" data-testid={`card-checkpoint-${cp.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" data-testid={`text-checkpoint-grinder-${cp.id}`}>{getGrinderName(cp.grinderId)}</span>
                      <span className="text-xs text-muted-foreground">#{cp.assignmentId}</span>
                      <Badge className={`${typeColors[cp.type] || "bg-white/10 text-foreground"} border text-[10px]`} data-testid={`badge-checkpoint-type-${cp.id}`}>
                        {cp.type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                      {cp.resolvedAt && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Resolved</Badge>
                      )}
                    </div>
                    {cp.response && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-checkpoint-response-${cp.id}`}>{cp.response}</p>
                    )}
                    {cp.note && (
                      <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-checkpoint-note-${cp.id}`}>{cp.note}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1" data-testid={`text-checkpoint-time-${cp.id}`}>
                      <Clock className="w-3 h-3" />
                      {cp.timestamp ? new Date(cp.timestamp).toLocaleString() : (cp.createdAt ? new Date(cp.createdAt).toLocaleString() : "—")}
                      <button
                        className="ml-1 p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-edit-time-${cp.id}`}
                        onClick={() => {
                          setEditTimeCheckpointId(cp.id);
                          const dt = cp.timestamp || cp.createdAt;
                          if (dt) {
                            const d = new Date(dt);
                            const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setEditTimeValue(local);
                          } else {
                            setEditTimeValue("");
                          }
                          setEditTimeDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </p>
                  </div>
                  {isUnresolvedIssue && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-resolve-checkpoint-${cp.id}`}
                      className="text-red-400 border-red-500/30"
                      onClick={() => {
                        setResolveCheckpointId(cp.id);
                        setResolveNote("");
                        setResolveDialogOpen(true);
                      }}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Issue Checkpoint</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-xs text-muted-foreground font-medium">Resolution Note</label>
                <Textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                  className="resize-none bg-background/50 border-white/10 min-h-[80px]"
                  data-testid="textarea-resolve-note"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResolveDialogOpen(false)} data-testid="button-cancel-resolve">
                  Cancel
                </Button>
                <Button
                  data-testid="button-confirm-resolve"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
                  disabled={!resolveNote || resolveCheckpointMutation.isPending}
                  onClick={() => resolveCheckpointMutation.mutate({
                    id: resolveCheckpointId,
                    resolvedBy: user?.discordUsername || user?.id || "staff",
                    resolvedNote: resolveNote,
                  })}
                >
                  {resolveCheckpointMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Resolve
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editTimeDialogOpen} onOpenChange={setEditTimeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Checkpoint Time</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-xs text-muted-foreground font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={editTimeValue}
                  onChange={(e) => setEditTimeValue(e.target.value)}
                  className="bg-background/50 border-white/10"
                  data-testid="input-edit-checkpoint-time"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditTimeDialogOpen(false)} data-testid="button-cancel-edit-time">
                  Cancel
                </Button>
                <Button
                  data-testid="button-confirm-edit-time"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                  disabled={!editTimeValue || editTimeMutation.isPending}
                  onClick={() => editTimeMutation.mutate({
                    id: editTimeCheckpointId,
                    createdAt: new Date(editTimeValue).toISOString(),
                  })}
                >
                  {editTimeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                  Save Time
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </FadeInUp>
      )}

      {activeTab === "updates" && (
        <FadeInUp>
        <div className="space-y-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order Updates</span>

          {orderUpdates.isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!orderUpdates.isLoading && updatesList.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]">
              No order updates yet.
            </div>
          )}

          <div className="space-y-2">
            {updatesList.map((upd: any) => {
              const isAcknowledged = !!upd.acknowledgedAt || !!upd.acknowledgedBy;

              return (
                <div key={upd.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]" data-testid={`card-update-${upd.id}`}>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" data-testid={`text-update-grinder-${upd.id}`}>
                        {getGrinderName(upd.grinderId)}
                      </span>
                      <span className="text-xs text-muted-foreground">#{upd.assignmentId}</span>
                      {upd.type && (
                        <Badge variant="outline" className="text-[10px]" data-testid={`badge-update-type-${upd.id}`}>
                          {upd.type}
                        </Badge>
                      )}
                      {isAcknowledged && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]" data-testid={`badge-update-ack-${upd.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80 mt-1" data-testid={`text-update-message-${upd.id}`}>{upd.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {upd.createdAt ? new Date(upd.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  {!isAcknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-acknowledge-update-${upd.id}`}
                      disabled={acknowledgeUpdateMutation.isPending}
                      onClick={() => acknowledgeUpdateMutation.mutate({
                        id: upd.id,
                        acknowledgedBy: user?.discordUsername || user?.id || "staff",
                      })}
                    >
                      {acknowledgeUpdateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                      Acknowledge
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
