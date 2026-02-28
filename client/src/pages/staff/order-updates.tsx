import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HelpTip } from "@/components/help-tip";
import {
  MessageSquare, CheckCircle, Clock, AlertTriangle, Search,
  FileText, Image, Calendar, User, Hash, Filter, Activity,
  TrendingUp, Zap, Shield, ArrowUpRight, Eye, RefreshCw
} from "lucide-react";

type OrderUpdate = {
  id: string;
  displayId?: string;
  assignmentId: string;
  orderId: string;
  grinderId: string;
  updateType: string;
  message: string;
  newDeadline?: string;
  deadlineStatus?: string;
  deadlineReviewedBy?: string;
  deadlineReviewedAt?: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
  proofUrls?: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
};

type Order = {
  id: string;
  displayId?: string;
  serviceId: string;
  customerPrice: string;
  platform?: string;
  status: string;
  isRush: boolean;
  isEmergency: boolean;
  assignedGrinderId?: string;
  customerDiscordId?: string;
  discordTicketChannelId?: string;
};

type Assignment = {
  id: string;
  displayId?: string;
  grinderId: string;
  orderId: string;
  status: string;
  wasReassigned: boolean;
  replacementGrinderId?: string;
  originalGrinderId?: string;
};

type Grinder = {
  id: string;
  name: string;
  discordUsername?: string;
  tier?: string;
};

type Service = {
  id: string;
  name: string;
};

export default function StaffOrderUpdates() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOrder, setFilterOrder] = useState("all");
  const [filterGrinder, setFilterGrinder] = useState("all");
  const [filterSpecial, setFilterSpecial] = useState("all");

  const { data: updates = [], isLoading: updatesLoading } = useQuery<OrderUpdate[]>({
    queryKey: ["/api/staff/order-updates"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: grinders = [] } = useQuery<Grinder[]>({
    queryKey: ["/api/grinders"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ id, acknowledgedBy }: { id: string; acknowledgedBy: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/order-updates/${id}/acknowledge`, { acknowledgedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/order-updates"] });
      toast({ title: "Update Acknowledged" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ordersMap = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);
  const assignmentsMap = useMemo(() => new Map(assignments.map(a => [a.id, a])), [assignments]);
  const grindersMap = useMemo(() => new Map(grinders.map(g => [g.id, g])), [grinders]);
  const servicesMap = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);

  const enrichedUpdates = useMemo(() => {
    return updates.map(u => {
      const assignment = assignmentsMap.get(u.assignmentId);
      const order = ordersMap.get(u.orderId);
      const grinder = grindersMap.get(u.grinderId);
      const service = order ? servicesMap.get(order.serviceId) : undefined;
      return {
        ...u,
        order,
        assignment,
        grinder,
        service,
        isReplacement: assignment?.wasReassigned || false,
        isEmergency: order?.isEmergency || false,
        isRush: order?.isRush || false,
      };
    });
  }, [updates, ordersMap, assignmentsMap, grindersMap, servicesMap]);

  const filtered = useMemo(() => {
    return enrichedUpdates.filter(u => {
      if (filterType !== "all" && u.updateType !== filterType) return false;
      if (filterStatus === "acknowledged" && !u.acknowledgedBy) return false;
      if (filterStatus === "pending" && u.acknowledgedBy) return false;
      if (filterOrder !== "all" && u.orderId !== filterOrder) return false;
      if (filterGrinder !== "all" && u.grinderId !== filterGrinder) return false;
      if (filterSpecial === "replacement" && !u.isReplacement) return false;
      if (filterSpecial === "emergency" && !u.isEmergency) return false;
      if (filterSpecial === "rush" && !u.isRush) return false;
      if (filterSpecial === "deadline" && u.updateType !== "deadline_extension") return false;
      if (filterSpecial === "has-proof" && (!u.proofUrls || u.proofUrls.length === 0)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const gName = u.grinder?.name?.toLowerCase() || "";
        const gUser = u.grinder?.discordUsername?.toLowerCase() || "";
        const msg = u.message?.toLowerCase() || "";
        const oId = u.order?.displayId?.toLowerCase() || u.orderId.toLowerCase();
        const uId = u.displayId?.toLowerCase() || u.id.toLowerCase();
        if (!gName.includes(term) && !gUser.includes(term) && !msg.includes(term) && !oId.includes(term) && !uId.includes(term)) return false;
      }
      return true;
    });
  }, [enrichedUpdates, filterType, filterStatus, filterOrder, filterGrinder, filterSpecial, searchTerm]);

  const kpiStats = useMemo(() => {
    const total = enrichedUpdates.length;
    const pending = enrichedUpdates.filter(u => !u.acknowledgedBy).length;
    const acknowledged = total - pending;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayUpdates = enrichedUpdates.filter(u => new Date(u.createdAt) >= today).length;
    const deadlineRequests = enrichedUpdates.filter(u => u.updateType === "deadline_extension").length;
    const pendingDeadlines = enrichedUpdates.filter(u => u.updateType === "deadline_extension" && u.deadlineStatus === "pending").length;
    const withProofs = enrichedUpdates.filter(u => u.proofUrls && u.proofUrls.length > 0).length;
    const replacementUpdates = enrichedUpdates.filter(u => u.isReplacement).length;
    const emergencyUpdates = enrichedUpdates.filter(u => u.isEmergency).length;
    const rushUpdates = enrichedUpdates.filter(u => u.isRush).length;

    const uniqueGrinders = new Set(enrichedUpdates.map(u => u.grinderId)).size;
    const uniqueOrders = new Set(enrichedUpdates.map(u => u.orderId)).size;

    return { total, pending, acknowledged, todayUpdates, deadlineRequests, pendingDeadlines, withProofs, replacementUpdates, emergencyUpdates, rushUpdates, uniqueGrinders, uniqueOrders };
  }, [enrichedUpdates]);

  const uniqueOrderIds = useMemo(() => {
    const ids = [...new Set(enrichedUpdates.map(u => u.orderId))];
    return ids.map(id => ({ id, label: ordersMap.get(id)?.displayId || id })).sort((a, b) => a.label.localeCompare(b.label));
  }, [enrichedUpdates, ordersMap]);

  const uniqueGrinderIds = useMemo(() => {
    const ids = [...new Set(enrichedUpdates.map(u => u.grinderId))];
    return ids.map(id => ({ id, label: grindersMap.get(id)?.name || id })).sort((a, b) => a.label.localeCompare(b.label));
  }, [enrichedUpdates, grindersMap]);

  function getUpdateTypeConfig(type: string) {
    switch (type) {
      case "progress": return { label: "Progress", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Activity };
      case "completion": return { label: "Completion", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle };
      case "deadline_extension": return { label: "Deadline Extension", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock };
      case "issue": return { label: "Issue", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: AlertTriangle };
      case "login": return { label: "Login", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", icon: ArrowUpRight };
      case "logoff": return { label: "Logoff", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: ArrowUpRight };
      default: return { label: type, color: "bg-muted text-muted-foreground border-border", icon: FileText };
    }
  }

  if (updatesLoading) {
    return (
      <div className="space-y-6 p-1" data-testid="page-order-updates-loading">
        <div className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1" data-testid="page-order-updates">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-3" data-testid="text-page-title">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            Order Updates
            <HelpTip text="Grinders submit progress updates and proof here. Deadline extension requests need your approval — check the reason and approve or deny. Acknowledge updates to let grinders know you've seen them." />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">All grinder progress updates, proof uploads, and deadline requests</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/staff/order-updates"] })}
          data-testid="button-refresh-updates"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Updates", value: kpiStats.total, icon: MessageSquare, gradient: "from-blue-500/[0.08] to-blue-500/[0.03]", iconBg: "bg-blue-500/15", text: "text-blue-400" },
          { label: "Pending Review", value: kpiStats.pending, icon: Clock, gradient: "from-amber-500/[0.08] to-amber-500/[0.03]", iconBg: "bg-amber-500/15", text: "text-amber-400" },
          { label: "Today's Updates", value: kpiStats.todayUpdates, icon: Zap, gradient: "from-emerald-500/[0.08] to-emerald-500/[0.03]", iconBg: "bg-emerald-500/15", text: "text-emerald-400" },
          { label: "With Proof", value: kpiStats.withProofs, icon: Image, gradient: "from-purple-500/[0.08] to-purple-500/[0.03]", iconBg: "bg-purple-500/15", text: "text-purple-400" },
        ].map((kpi, i) => (
          <Card key={i} className={`border-0 bg-gradient-to-br ${kpi.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${kpi.text} tracking-tight`} data-testid={`text-kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>{kpi.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{kpi.label}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Acknowledged", value: kpiStats.acknowledged, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Deadline Requests", value: kpiStats.deadlineRequests, icon: Calendar, color: "text-amber-400" },
          { label: "Replacement Orders", value: kpiStats.replacementUpdates, icon: RefreshCw, color: "text-orange-400" },
          { label: "Emergency Orders", value: kpiStats.emergencyUpdates, icon: AlertTriangle, color: "text-red-400" },
          { label: "Rush Orders", value: kpiStats.rushUpdates, icon: Zap, color: "text-yellow-400" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 bg-white/[0.03]">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} />
              <div>
                <p className={`text-lg font-bold ${stat.color}`} data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-white/30">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-testid="input-search-updates"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="deadline_extension">Deadline Extension</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logoff">Logoff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSpecial} onValueChange={setFilterSpecial}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-filter-special">
                <SelectValue placeholder="Special" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="replacement">Replacement Grinder</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="rush">Rush</SelectItem>
                <SelectItem value="deadline">Deadline Requests</SelectItem>
                <SelectItem value="has-proof">Has Proof</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOrder} onValueChange={setFilterOrder}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-filter-order">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {uniqueOrderIds.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGrinder} onValueChange={setFilterGrinder}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-filter-grinder">
                <SelectValue placeholder="Grinder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grinders</SelectItem>
                {uniqueGrinderIds.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" data-testid="text-results-count">
          Showing {filtered.length} of {enrichedUpdates.length} updates
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>{kpiStats.uniqueGrinders} grinders</span>
          <span className="text-white/10">|</span>
          <Hash className="w-3.5 h-3.5" />
          <span>{kpiStats.uniqueOrders} orders</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white/50">No Updates Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {enrichedUpdates.length === 0 ? "No order updates have been submitted yet." : "Try adjusting your filters to see results."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="list-order-updates">
          {filtered.map(u => {
            const typeConfig = getUpdateTypeConfig(u.updateType);
            const TypeIcon = typeConfig.icon;
            const hasMedia = (u.mediaUrls && u.mediaUrls.length > 0) || (u.proofUrls && u.proofUrls.length > 0);
            const isPending = !u.acknowledgedBy;

            return (
              <Card
                key={u.id}
                className={`border-0 overflow-hidden relative transition-all ${isPending ? "bg-white/[0.04] hover:bg-white/[0.06]" : "bg-white/[0.02]"}`}
                data-testid={`card-update-${u.id}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.01] -translate-y-8 translate-x-8" />
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPending ? "bg-amber-500/15" : "bg-emerald-500/10"}`}>
                      <TypeIcon className={`w-5 h-5 ${isPending ? "text-amber-400" : "text-emerald-400/60"}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={typeConfig.color} data-testid={`badge-type-${u.id}`}>
                            {typeConfig.label}
                          </Badge>
                          {u.isEmergency && (
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Emergency
                            </Badge>
                          )}
                          {u.isRush && !u.isEmergency && (
                            <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 gap-1">
                              <Zap className="w-3 h-3" />
                              Rush
                            </Badge>
                          )}
                          {u.isReplacement && (
                            <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Replacement
                            </Badge>
                          )}
                          {hasMedia && (
                            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1">
                              <Image className="w-3 h-3" />
                              Proof
                            </Badge>
                          )}
                          {u.deadlineStatus === "pending" && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 gap-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Deadline Pending
                            </Badge>
                          )}
                          {isPending ? (
                            <Badge className="bg-amber-500/10 text-amber-400/80 border-amber-500/20">Pending</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400/60 border-emerald-500/20">Acknowledged</Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap" data-testid={`text-date-${u.id}`}>
                          {new Date(u.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-white/70 leading-relaxed" data-testid={`text-message-${u.id}`}>
                        {u.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span className="font-medium text-white/50">{u.grinder?.name || u.grinderId}</span>
                          {u.grinder?.tier && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{u.grinder.tier}</Badge>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">{u.order?.displayId || u.orderId}</span>
                        </span>
                        {u.service && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            {u.service.name}
                          </span>
                        )}
                        {u.order?.platform && (
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            {u.order.platform}
                          </span>
                        )}
                        {u.displayId && (
                          <span className="font-mono text-white/30">{u.displayId}</span>
                        )}
                      </div>

                      {u.newDeadline && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300">New deadline requested:</span>
                          <span className="font-medium text-white/60">{new Date(u.newDeadline).toLocaleDateString()}</span>
                          {u.deadlineStatus && (
                            <Badge className={
                              u.deadlineStatus === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                              u.deadlineStatus === "denied" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                              "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }>
                              {u.deadlineStatus}
                            </Badge>
                          )}
                        </div>
                      )}

                      {hasMedia && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {(u.proofUrls || []).map((url, pi) => (
                            <a
                              key={`proof-${pi}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
                              data-testid={`link-proof-${u.id}-${pi}`}
                            >
                              <Eye className="w-3 h-3" />
                              Proof {pi + 1}
                            </a>
                          ))}
                          {(u.mediaUrls || []).map((url, mi) => (
                            <a
                              key={`media-${mi}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/20 transition-colors"
                              data-testid={`link-media-${u.id}-${mi}`}
                            >
                              <Image className="w-3 h-3" />
                              Media {mi + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {isPending && (
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => acknowledgeMutation.mutate({ id: u.id, acknowledgedBy: "staff" })}
                            disabled={acknowledgeMutation.isPending}
                            data-testid={`button-acknowledge-${u.id}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Acknowledge
                          </Button>
                        </div>
                      )}

                      {u.acknowledgedBy && (
                        <p className="text-[10px] text-emerald-400/40">
                          Acknowledged by {u.acknowledgedBy} · {u.acknowledgedAt ? new Date(u.acknowledgedAt).toLocaleString() : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}