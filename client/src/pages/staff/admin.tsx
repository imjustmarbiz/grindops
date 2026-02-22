import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, categoryIcon } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Crown, AlertTriangle, Users, Shield, Ban, Gavel, Repeat,
  ArrowRight, CheckCircle, Loader2,
} from "lucide-react";

export default function StaffAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const {
    grinders: allGrinders,
    assignments: allAssignments,
    orders: allOrders,
    eliteRequests: eliteRequestsList,
    strikeLogs: strikeLogsList,
  } = useStaffData();

  const [strikeGrinderId, setStrikeGrinderId] = useState("");
  const [strikeReason, setStrikeReason] = useState("");
  const [editLimitGrinderId, setEditLimitGrinderId] = useState("");
  const [editLimitValue, setEditLimitValue] = useState("");
  const [removeGrinder, setRemoveGrinder] = useState<any>(null);
  const [editProfileGrinder, setEditProfileGrinder] = useState<any>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileCategory, setEditProfileCategory] = useState("");
  const [editProfileTier, setEditProfileTier] = useState("");
  const [editProfileCapacity, setEditProfileCapacity] = useState("");
  const [editProfileNotes, setEditProfileNotes] = useState("");

  const eliteReqMutation = useMutation({
    mutationFn: async ({ id, status, decisionNotes }: { id: string; status: string; decisionNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/elite-requests/${id}`, { status, reviewedBy: "staff", decisionNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/elite-requests"] });
      toast({ title: "Elite request updated" });
    },
  });

  const strikeMutation = useMutation({
    mutationFn: async (data: { grinderId: string; action: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/staff/strikes", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Strike updated" });
    },
  });

  const finePayMutation = useMutation({
    mutationFn: async (grinderId: string) => {
      const res = await apiRequest("POST", `/api/staff/fines/${grinderId}/pay`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      toast({ title: "Fines marked as paid, suspension lifted" });
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: async ({ grinderId, capacity }: { grinderId: string; capacity: number }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, { capacity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditLimitGrinderId("");
      setEditLimitValue("");
      toast({ title: "Order limit updated" });
    },
    onError: () => {
      toast({ title: "Failed to update order limit", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ grinderId, data }: { grinderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditProfileGrinder(null);
      toast({ title: "Grinder profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const removeGrinderMutation = useMutation({
    mutationFn: async (grinderId: string) => {
      const res = await apiRequest("DELETE", `/api/grinders/${grinderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setRemoveGrinder(null);
      toast({ title: "Grinder removed permanently" });
    },
    onError: () => toast({ title: "Failed to remove grinder", variant: "destructive" }),
  });

  const replacedAssignments = allAssignments.filter(a => a.wasReassigned);
  const totalOriginalGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.originalGrinderPay || 0), 0);
  const totalReplacementGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.replacementGrinderPay || 0), 0);
  const replacementRate = allAssignments.length > 0 ? (replacedAssignments.length / allAssignments.length) * 100 : 0;
  const grindersReplacedOff = Array.from(new Set(replacedAssignments.map(a => a.originalGrinderId).filter(Boolean)));

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-staff-admin">
      <div>
        <h1 className="text-xl sm:text-3xl font-display font-bold text-glow" data-testid="text-admin-title">
          <Gavel className="w-6 h-6 inline-block mr-2 text-primary" />
          Admin Management
        </h1>
        <p className="text-muted-foreground mt-1">Elite requests, strikes, limits, and profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Elite Requests Review */}
        <Card className="glass-panel border-amber-500/20" data-testid="card-elite-requests">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Elite Requests Review
              {eliteRequestsList && (
                <Badge className="bg-amber-500/20 text-amber-400 ml-auto">
                  {eliteRequestsList.filter((r: any) => r.status === "Pending").length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(!eliteRequestsList || eliteRequestsList.length === 0) && (
                <p className="text-muted-foreground text-sm" data-testid="text-no-elite-requests">No elite requests</p>
              )}
              {(eliteRequestsList || []).map((req: any) => {
                const grinder = allGrinders.find(g => g.id === req.grinderId);
                return (
                  <div key={req.id} className={`p-3 rounded-lg bg-white/5 border ${req.status === "Pending" ? "border-amber-500/30" : "border-white/10"}`} data-testid={`card-elite-req-${req.id}`}>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium">{grinder?.name || req.grinderId}</span>
                      <Badge className={
                        req.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" :
                        req.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        "bg-amber-500/20 text-amber-400"
                      }>{req.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px] text-muted-foreground mb-2">
                      <div className="text-center"><p className="font-bold text-foreground">{req.completedOrders ?? grinder?.completedOrders ?? 0}</p>Orders</div>
                      <div className="text-center"><p className="font-bold text-foreground">{Number(req.winRate ?? grinder?.winRate ?? 0).toFixed(0)}%</p>Win Rate</div>
                      <div className="text-center"><p className="font-bold text-foreground">{req.avgQualityRating ? (Number(req.avgQualityRating) / 20).toFixed(1) : "N/A"}/5</p>Quality</div>
                      <div className="text-center"><p className="font-bold text-foreground">{Number(req.onTimeRate ?? 0).toFixed(0)}%</p>On-Time</div>
                      <div className="text-center"><p className="font-bold text-foreground">{req.strikes ?? grinder?.strikes ?? 0}</p>Strikes</div>
                    </div>
                    {req.decisionNotes && <p className="text-xs text-muted-foreground italic mb-2">{req.decisionNotes}</p>}
                    {req.status === "Pending" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-xs bg-emerald-600" data-testid={`button-approve-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Approved" })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400" data-testid={`button-deny-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Denied" })}>
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Strike Management */}
        <Card className="glass-panel border-red-500/20" data-testid="card-strike-management">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Strike Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Select value={strikeGrinderId} onValueChange={setStrikeGrinderId}>
                  <SelectTrigger data-testid="select-strike-grinder">
                    <SelectValue placeholder="Select grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGrinders.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.strikes} strikes)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Reason for strike action"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  data-testid="input-strike-reason"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="destructive" className="text-xs"
                    data-testid="button-add-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "add", reason: strikeReason }); setStrikeReason(""); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    data-testid="button-remove-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "remove", reason: strikeReason }); setStrikeReason(""); }}>
                    Remove Strike
                  </Button>
                </div>
              </div>
              {allGrinders.filter(g => g.suspended).length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 space-y-2">
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended Grinders</p>
                  {allGrinders.filter(g => g.suspended).map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-xs" data-testid={`row-suspended-${g.id}`}>
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-red-400 font-bold">${parseFloat(g.outstandingFine || "0").toFixed(2)}</span>
                      <Button size="sm" variant="outline" className="text-xs border-green-500/30 text-green-400"
                        data-testid={`button-pay-fine-${g.id}`}
                        disabled={finePayMutation.isPending}
                        onClick={() => finePayMutation.mutate(g.id)}>
                        Mark Paid
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(!strikeLogsList || strikeLogsList.length === 0) && <p className="text-muted-foreground text-xs" data-testid="text-no-strike-logs">No strike logs</p>}
                {(strikeLogsList || []).slice(0, 10).map((log: any) => {
                  const grinder = allGrinders.find(g => g.id === log.grinderId);
                  return (
                    <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-xs" data-testid={`card-strike-${log.id}`}>
                      <Badge className={log.action === "add" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"} variant="outline">
                        {log.action === "add" ? "+" : "-"}
                      </Badge>
                      <span className="font-medium flex-1 truncate">{grinder?.name || log.grinderId}</span>
                      {parseFloat(log.fineAmount || "0") > 0 && (
                        <Badge className={log.finePaid ? "bg-green-500/15 text-green-400 text-[9px]" : "bg-red-500/15 text-red-400 text-[9px]"}>
                          ${parseFloat(log.fineAmount).toFixed(0)} {log.finePaid ? "Paid" : "Owed"}
                        </Badge>
                      )}
                      <span className="text-muted-foreground truncate max-w-[100px]">{log.reason}</span>
                      <span className="text-muted-foreground text-[10px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grinder Order Limits */}
      <Card className="glass-panel border-purple-500/20" data-testid="card-order-limits">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Grinder Order Limits
            <Badge className="bg-purple-500/20 text-purple-400 ml-auto">{allGrinders.length} grinders</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allGrinders.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10" data-testid={`row-limit-${g.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    {g.suspended && <Badge className="bg-red-500/20 text-red-400 text-[9px]"><Ban className="w-2.5 h-2.5 mr-0.5" />Suspended</Badge>}
                    {!(g as any).rulesAccepted && <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Rules Pending</Badge>}
                    <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                    <Badge className={`text-[10px] ${
                      (g as any).availabilityStatus === "busy" ? "bg-yellow-500/20 text-yellow-400" :
                      (g as any).availabilityStatus === "away" ? "bg-orange-500/20 text-orange-400" :
                      (g as any).availabilityStatus === "offline" ? "bg-red-500/20 text-red-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {(g as any).availabilityStatus || "available"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {g.activeOrders} active / {g.capacity} limit
                    {(g as any).availabilityNote && ` · ${(g as any).availabilityNote}`}
                  </span>
                </div>
                {editLimitGrinderId === g.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      className="w-16 text-xs"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      data-testid={`input-limit-${g.id}`}
                    />
                    <Button size="icon" variant="ghost"
                      data-testid={`button-save-limit-${g.id}`}
                      disabled={!editLimitValue || updateLimitMutation.isPending}
                      onClick={() => updateLimitMutation.mutate({ grinderId: g.id, capacity: parseInt(editLimitValue) })}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { setEditLimitGrinderId(""); setEditLimitValue(""); }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${g.activeOrders >= g.capacity ? "text-red-400" : "text-emerald-400"}`}>{g.capacity}</span>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground"
                      data-testid={`button-edit-limit-${g.id}`}
                      onClick={() => { setEditLimitGrinderId(g.id); setEditLimitValue(String(g.capacity)); }}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff/Owner: Edit Grinder Profiles */}
      {(isOwner || user?.role === "staff") && (
        <Card className="glass-panel border-amber-500/20" data-testid="card-owner-profiles">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Edit Grinder Profiles
              <Badge className="bg-amber-500/20 text-amber-400 ml-auto">{allGrinders.length} grinders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allGrinders.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10" data-testid={`row-profile-${g.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{g.name}</span>
                      <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{g.tier}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {g.activeOrders}/{g.capacity} orders · {g.completedOrders} completed · {g.strikes} strikes
                      </span>
                    </div>
                    {g.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-amber-400 text-xs"
                      data-testid={`button-edit-profile-${g.id}`}
                      onClick={() => {
                        setEditProfileGrinder(g);
                        setEditProfileName(g.name);
                        setEditProfileCategory(g.category);
                        setEditProfileTier(g.tier);
                        setEditProfileCapacity(String(g.capacity));
                        setEditProfileNotes(g.notes || "");
                      }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 text-xs hover:text-red-300 hover:bg-red-500/10"
                      data-testid={`button-remove-grinder-${g.id}`}
                      onClick={() => setRemoveGrinder(g)}>
                      <Ban className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={!!editProfileGrinder} onOpenChange={(open) => !open && setEditProfileGrinder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Edit Profile: {editProfileGrinder?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} data-testid="input-profile-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editProfileCategory} onValueChange={setEditProfileCategory}>
                  <SelectTrigger data-testid="select-profile-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grinder">Grinder</SelectItem>
                    <SelectItem value="Elite Grinder">Elite Grinder</SelectItem>
                    <SelectItem value="VC Grinder">VC Grinder</SelectItem>
                    <SelectItem value="Event Grinder">Event Grinder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tier</label>
                <Select value={editProfileTier} onValueChange={setEditProfileTier}>
                  <SelectTrigger data-testid="select-profile-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Order Limit</label>
              <Input type="number" min="1" max="20" value={editProfileCapacity} onChange={(e) => setEditProfileCapacity(e.target.value)} data-testid="input-profile-capacity" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={editProfileNotes} onChange={(e) => setEditProfileNotes(e.target.value)} placeholder="Owner notes about this grinder..." data-testid="input-profile-notes" />
            </div>
            <Button className="w-full bg-amber-600"
              data-testid="button-save-profile"
              disabled={updateProfileMutation.isPending}
              onClick={() => {
                const data: any = {};
                if (editProfileName && editProfileName !== editProfileGrinder?.name) data.name = editProfileName;
                if (editProfileCategory && editProfileCategory !== editProfileGrinder?.category) data.category = editProfileCategory;
                if (editProfileTier && editProfileTier !== editProfileGrinder?.tier) data.tier = editProfileTier;
                const capNum = parseInt(editProfileCapacity);
                if (!isNaN(capNum) && capNum > 0 && capNum !== editProfileGrinder?.capacity) data.capacity = capNum;
                if (editProfileNotes !== (editProfileGrinder?.notes || "")) data.notes = editProfileNotes;
                if (Object.keys(data).length === 0) { toast({ title: "No changes to save" }); return; }
                updateProfileMutation.mutate({ grinderId: editProfileGrinder.id, data });
              }}>
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              Save Profile Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Grinder Confirmation Dialog */}
      <Dialog open={!!removeGrinder} onOpenChange={(open) => !open && setRemoveGrinder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Ban className="w-5 h-5" />
              Remove Grinder Permanently
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 font-medium mb-2">This action cannot be undone.</p>
              <p className="text-sm text-muted-foreground">
                Removing <span className="text-white font-semibold">{removeGrinder?.name}</span> will permanently delete their profile, all bids, assignments, strike logs, payout requests, and related data.
              </p>
            </div>
            {removeGrinder && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded bg-white/5">
                  <span className="text-muted-foreground">Orders:</span>{" "}
                  <span className="font-medium">{removeGrinder.totalOrders || 0}</span>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-muted-foreground">Active:</span>{" "}
                  <span className="font-medium">{removeGrinder.activeOrders || 0}</span>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-muted-foreground">Strikes:</span>{" "}
                  <span className="font-medium">{removeGrinder.strikes || 0}</span>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-muted-foreground">Earnings:</span>{" "}
                  <span className="font-medium">{formatCurrency(Number(removeGrinder.totalEarnings || 0))}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveGrinder(null)} data-testid="button-cancel-remove">
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-confirm-remove"
                disabled={removeGrinderMutation.isPending}
                onClick={() => removeGrinderMutation.mutate(removeGrinder.id)}>
                {removeGrinderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                Remove Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replacement Tracker */}
      {replacedAssignments.length > 0 && (
        <Card className="glass-panel border-border/50" data-testid="card-replacement-tracker">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="w-5 h-5 text-amber-400" />
              Replacement Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-amber-400" data-testid="text-replacement-count">{replacedAssignments.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Replacements</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-red-400" data-testid="text-paid-originals">{formatCurrency(totalOriginalGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Paid to Originals</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-blue-400" data-testid="text-paid-replacements">{formatCurrency(totalReplacementGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Paid to Replacements</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-amber-400" data-testid="text-grinders-removed">{grindersReplacedOff.length}</p>
                <p className="text-[10px] text-muted-foreground">Grinders Removed</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold" data-testid="text-replacement-rate">{replacementRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">Replacement Rate</p>
              </div>
            </div>
            <div className="space-y-2">
              {replacedAssignments.slice(0, 5).map(a => {
                const orig = allGrinders.find(g => g.id === a.originalGrinderId);
                const repl = allGrinders.find(g => g.id === a.replacementGrinderId);
                const order = allOrders.find(o => o.id === a.orderId);
                return (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-white/5" data-testid={`row-replacement-${a.id}`}>
                    <div className="flex items-center gap-1.5 text-sm flex-1 min-w-[140px]">
                      <span className="text-red-400 font-medium">{orig?.name || "Unknown"}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-blue-400 font-medium">{repl?.name || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : ""}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400">${a.originalGrinderPay || "0"}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-blue-400">${a.replacementGrinderPay || "0"}</span>
                    </div>
                    {a.replacementReason && (
                      <Badge variant="outline" className="text-[10px] border-border/50 max-w-[120px] truncate">
                        {a.replacementReason}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
