import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, pluralize } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Target, Bell, Send, Trash2, Loader2, ToggleLeft, ToggleRight,
  CheckCircle, X, CreditCard, Package, Zap, AlertTriangle, Link2, ExternalLink, Unlink, Wrench,
  DatabaseZap, Settings, Pencil, Save,
} from "lucide-react";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Service } from "@shared/schema";


const DATA_TABLES = [
  { key: "orders", label: "Orders", desc: "All orders" },
  { key: "bids", label: "Bids", desc: "All bids/proposals" },
  { key: "assignments", label: "Assignments", desc: "All grinder assignments" },
  { key: "grinders", label: "Grinders", desc: "All grinder profiles" },
  { key: "payout_requests", label: "Payouts", desc: "All payout requests" },
  { key: "notifications", label: "Notifications", desc: "All notifications" },
  { key: "audit_logs", label: "Audit Logs", desc: "Activity audit trail" },
  { key: "activity_checkpoints", label: "Activity Checkpoints", desc: "Login/logout checkpoints" },
  { key: "strike_logs", label: "Strike Logs", desc: "Strike history" },
  { key: "strike_appeals", label: "Strike Appeals", desc: "Strike appeal records" },
  { key: "customer_reviews", label: "Customer Reviews", desc: "Customer review submissions" },
  { key: "messages", label: "Messages", desc: "Chat messages" },
  { key: "message_threads", label: "Message Threads", desc: "Chat threads" },
  { key: "thread_participants", label: "Thread Participants", desc: "Thread membership" },
  { key: "events", label: "Events & Promos", desc: "Events and promotions" },
  { key: "patch_notes", label: "Patch Notes", desc: "Staff patch notes" },
  { key: "performance_reports", label: "Performance Reports", desc: "Generated reports" },
  { key: "staff_tasks", label: "Staff Tasks", desc: "To-do list tasks" },
  { key: "grinder_badges", label: "Badges", desc: "Awarded grinder badges" },
];

function DeletionRequestsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/deletion-requests"],
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/deletion-requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deletion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Deletion approved" });
    },
    onError: (err: Error) => toast({ title: "Failed to approve", description: err.message, variant: "destructive" }),
  });

  const denyMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/deletion-requests/${id}/deny`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deletion-requests"] });
      toast({ title: "Deletion denied" });
    },
    onError: (err: Error) => toast({ title: "Failed to deny", description: err.message, variant: "destructive" }),
  });

  const pending = requests.filter((r: any) => r.status === "Pending");
  const resolved = requests.filter((r: any) => r.status !== "Pending").slice(0, 10);

  return (
    <Card className="border-0 bg-gradient-to-br from-orange-500/[0.08] via-background to-orange-900/[0.04] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/[0.04] -translate-y-12 translate-x-12" />
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-orange-400" />
          </div>
          Deletion Requests
          {pending.length > 0 && (
            <Badge variant="destructive" className="ml-auto" data-testid="badge-pending-deletions">
              {pending.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length === 0 && resolved.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No deletion requests</p>
        )}
        {pending.map((r: any) => (
          <div key={r.id} className="p-3 rounded-lg bg-white/[0.04] border border-orange-500/20 space-y-2" data-testid={`deletion-request-${r.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{r.entityLabel || r.entityId}</p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="mr-1 text-[10px] px-1.5 py-0">{r.entityType}</Badge>
                  by {r.requestedByName || "Staff"}
                </p>
              </div>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">Pending</Badge>
            </div>
            <p className="text-xs text-muted-foreground bg-white/[0.03] rounded p-2">{r.reason}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(r.id)}
                data-testid={`button-approve-deletion-${r.id}`}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                disabled={denyMutation.isPending}
                onClick={() => denyMutation.mutate({ id: r.id, reason: "Denied by owner" })}
                data-testid={`button-deny-deletion-${r.id}`}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Deny
              </Button>
            </div>
          </div>
        ))}
        {resolved.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
            {resolved.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.02]">
                <span className="text-muted-foreground">{r.entityLabel || r.entityId}</span>
                <Badge variant="outline" className={r.status === "Approved" ? "text-red-400 border-red-500/20" : "text-muted-foreground"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClearDataPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/owner/clear-data", { tables: Array.from(selected) });
      return res.json();
    },
    onSuccess: (data) => {
      const cleared = Object.entries(data.results || {}).filter(([, v]) => v).length;
      queryClient.invalidateQueries();
      toast({ title: `Cleared ${cleared} table(s)`, description: "Data has been removed." });
      setSelected(new Set());
      setConfirmOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAll = () => {
    if (selected.size === DATA_TABLES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(DATA_TABLES.map(t => t.key)));
    }
  };

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-red-500/[0.08] via-background to-red-900/[0.04] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500/[0.04] -translate-y-12 translate-x-12" />
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
            <DatabaseZap className="w-4 h-4 text-red-400" />
          </div>
          Clear Data
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 ml-auto text-xs">Owner Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Select tables to clear. Services are managed separately below.</p>
          <Button variant="ghost" size="sm" className="text-xs" onClick={toggleAll} data-testid="button-toggle-all-tables">
            {selected.size === DATA_TABLES.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DATA_TABLES.map(t => (
            <label
              key={t.key}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                selected.has(t.key)
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-border/20 bg-white/[0.02] hover:border-border/40"
              }`}
            >
              <Checkbox
                checked={selected.has(t.key)}
                onCheckedChange={() => toggle(t.key)}
                data-testid={`checkbox-clear-${t.key}`}
              />
              <div>
                <span className="text-sm font-medium">{t.label}</span>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={selected.size === 0}
              data-testid="button-clear-data"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear {selected.size} Table{selected.size !== 1 ? "s" : ""}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Confirm Data Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">This will permanently delete all data from the following tables:</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selected).map(key => {
                  const t = DATA_TABLES.find(dt => dt.key === key);
                  return <Badge key={key} variant="destructive" className="text-xs">{t?.label || key}</Badge>;
                })}
              </div>
              <p className="text-sm font-medium text-red-400">This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                data-testid="button-confirm-clear-data"
              >
                {clearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Yes, Delete Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ServiceManagement({ services }: { services: Service[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editComplexity, setEditComplexity] = useState("1");
  const [editSla, setEditSla] = useState("5");
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newComplexity, setNewComplexity] = useState("1");
  const [newSla, setNewSla] = useState("5");

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditGroup(s.group);
    setEditComplexity(String(s.defaultComplexity));
    setEditSla(String(s.slaDays));
  };

  const cancelEdit = () => setEditId(null);

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/services", {
        name: newName, group: newGroup,
        defaultComplexity: parseInt(newComplexity), slaDays: parseInt(newSla),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service added" });
      setAddOpen(false);
      setNewName(""); setNewGroup(""); setNewComplexity("1"); setNewSla("5");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/services/${id}`, {
        name: editName, group: editGroup,
        defaultComplexity: parseInt(editComplexity), slaDays: parseInt(editSla),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated" });
      setEditId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("PATCH", `/api/services/${id}/toggle`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/services/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service removed" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-12 translate-x-12" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Settings className="w-4 h-4 text-emerald-400" />
            </div>
            Manage Services
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500" data-testid="button-add-service">
                <Plus className="w-3.5 h-3.5" /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Service Name</label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. VC Grinding 🪙" data-testid="input-service-name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Group</label>
                  <Input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="e.g. VC, Rep, Badges" data-testid="input-service-group" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Complexity (1-5)</label>
                    <Select value={newComplexity} onValueChange={setNewComplexity}>
                      <SelectTrigger data-testid="select-complexity"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">SLA Days</label>
                    <Select value={newSla} onValueChange={setNewSla}>
                      <SelectTrigger data-testid="select-sla"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,10,14].map(n => <SelectItem key={n} value={String(n)}>{n} days</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={() => addMutation.mutate()} disabled={!newName || !newGroup || addMutation.isPending} data-testid="button-confirm-add-service">
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Service"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-2">
          {services.map(s => editId === s.id ? (
            <div key={s.id} className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] space-y-3" data-testid={`row-service-edit-${s.id}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Name</label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" data-testid={`input-edit-name-${s.id}`} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Group</label>
                  <Input value={editGroup} onChange={e => setEditGroup(e.target.value)} className="h-8 text-sm" data-testid={`input-edit-group-${s.id}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Complexity</label>
                  <Select value={editComplexity} onValueChange={setEditComplexity}>
                    <SelectTrigger className="h-8 text-sm" data-testid={`select-edit-complexity-${s.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">SLA Days</label>
                  <Select value={editSla} onValueChange={setEditSla}>
                    <SelectTrigger className="h-8 text-sm" data-testid={`select-edit-sla-${s.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,10,14].map(n => <SelectItem key={n} value={String(n)}>{n} days</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={cancelEdit} data-testid={`button-cancel-edit-${s.id}`}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500" onClick={() => updateMutation.mutate(s.id)} disabled={!editName || !editGroup || updateMutation.isPending} data-testid={`button-save-edit-${s.id}`}>
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save
                </Button>
              </div>
            </div>
          ) : (
            <div key={s.id} className={`flex items-center justify-between py-2 px-3 rounded-lg border border-border/20 ${s.isActive ? "bg-white/[0.02]" : "bg-white/[0.01] opacity-50"}`} data-testid={`row-service-${s.id}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`font-medium text-sm ${!s.isActive ? "line-through text-muted-foreground" : ""}`}>{s.name}</span>
                <Badge variant="secondary" className="text-[10px]">{s.group}</Badge>
                <span className="text-[10px] text-muted-foreground">Complexity: {s.defaultComplexity} | SLA: {s.slaDays}d</span>
                {!s.isActive && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">Inactive</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-400" onClick={() => startEdit(s)} data-testid={`button-edit-service-${s.id}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Switch
                  checked={s.isActive}
                  onCheckedChange={() => toggleMutation.mutate(s.id)}
                  disabled={toggleMutation.isPending}
                  data-testid={`toggle-service-${s.id}`}
                />
                <Dialog open={deleteId === s.id} onOpenChange={(open) => setDeleteId(open ? s.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" data-testid={`button-delete-service-${s.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Remove Service</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Are you sure you want to remove <strong>{s.name}</strong>?</p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-service">
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsContent({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const {
    orders: allOrders,
    bids: allBids,
    grinders: allGrinders,
    services: allServices,
    staffAlerts: staffAlertsList,
    analyticsLoading,
  } = useStaffData();

  const [manualOrderService, setManualOrderService] = useState("");
  const [manualOrderPrice, setManualOrderPrice] = useState("");
  const [manualOrderPlatform, setManualOrderPlatform] = useState("");
  const [manualOrderGamertag, setManualOrderGamertag] = useState("");
  const [manualOrderDueDays, setManualOrderDueDays] = useState("3");
  const [manualOrderNotes, setManualOrderNotes] = useState("");
  const [manualOrderSendToGrinders, setManualOrderSendToGrinders] = useState(true);
  const [manualOrderIsRush, setManualOrderIsRush] = useState(false);
  const [manualOrderComplexity, setManualOrderComplexity] = useState("1");

  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignGrinderId, setAssignGrinderId] = useState("");
  const [assignBidAmount, setAssignBidAmount] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const [ticketOrderId, setTicketOrderId] = useState("");
  const [ticketChannelId, setTicketChannelId] = useState("");

  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [alertTarget, setAlertTarget] = useState("all");
  const [alertGrinderId, setAlertGrinderId] = useState("");

  const createManualOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs?limit=15"] });
      setManualOrderService("");
      setManualOrderPrice("");
      setManualOrderPlatform("");
      setManualOrderGamertag("");
      setManualOrderDueDays("3");
      setManualOrderNotes("");
      setManualOrderSendToGrinders(true);
      setManualOrderIsRush(false);
      setManualOrderComplexity("1");
      toast({ title: "Manual order created", description: manualOrderSendToGrinders ? "Order is visible to grinders for bidding." : "Order created for manual assignment only." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create order", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const staffAssignMutation = useMutation({
    mutationFn: async (data: { orderId: string; grinderId: string; bidAmount: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/orders/${data.orderId}/assign`, {
        grinderId: data.grinderId,
        bidAmount: data.bidAmount,
        notes: data.notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs?limit=15"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bidding-timers"] });
      setAssignOrderId("");
      setAssignGrinderId("");
      setAssignBidAmount("");
      setAssignNotes("");
      toast({ title: "Grinder assigned successfully", description: "Order status, bids, and timers have been synced." });
    },
    onError: (err: any) => {
      toast({ title: "Assignment failed", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const alertMutation = useMutation({
    mutationFn: async (data: { targetType: string; grinderId?: string; title: string; message: string; severity: string }) => {
      const res = await apiRequest("POST", "/api/staff/alerts", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/alerts"] }); toast({ title: "Alert sent" }); },
  });

  const linkTicketMutation = useMutation({
    mutationFn: async (data: { orderId: string; discordTicketChannelId: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${data.orderId}/ticket`, { discordTicketChannelId: data.discordTicketChannelId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setTicketOrderId("");
      setTicketChannelId("");
      toast({ title: "Ticket linked", description: "Discord ticket has been linked to the order." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to link ticket", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const unlinkTicketMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("DELETE", `/api/orders/${orderId}/ticket`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Ticket unlinked" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to unlink ticket", description: err.message, variant: "destructive" });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/staff/alerts/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/alerts"] }); toast({ title: "Alert deleted" }); },
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const assignableOrders = allOrders.filter(o => o.status === "Open" || o.status === "Bidding Closed");
  const selectedOrder = assignableOrders.find(o => o.id === assignOrderId);
  const orderBids = allBids.filter(b => b.orderId === assignOrderId);
  const selectedGrinder = allGrinders.find(g => g.id === assignGrinderId);

  const content = (
    <div className="space-y-5 sm:space-y-6">
      {!embedded && (
        <FadeInUp>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wrench className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2" data-testid="text-page-title">
                  Operations
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Create orders, assign grinders, and send alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1">
                <Package className="w-3 h-3" />
                {pluralize(allOrders.length, 'order')}
              </Badge>
              <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 gap-1">
                <Target className="w-3 h-3" />
                {assignableOrders.length} assignable
              </Badge>
            </div>
          </div>
        </FadeInUp>
      )}

      {!embedded && (
        <FadeInUp>
          <BiddingCountdownPanel />
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-create-manual-order">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.04] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-400" />
            </div>
            Create Manual Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Service</label>
              <Select value={manualOrderService} onValueChange={setManualOrderService}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-service">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.filter(s => s.isActive !== false).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Customer Price ($)</label>
              <Input type="number" step="0.01" min="0" placeholder="Price" value={manualOrderPrice} onChange={(e) => setManualOrderPrice(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-price" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Platform</label>
              <Select value={manualOrderPlatform} onValueChange={setManualOrderPlatform}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="PS5">PS5</SelectItem>
                  <SelectItem value="PS4">PS4</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="Switch">Switch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Gamertag</label>
              <Input placeholder="Customer gamertag" value={manualOrderGamertag} onChange={(e) => setManualOrderGamertag(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-gamertag" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Due in (days)</label>
              <Input type="number" min="1" placeholder="3" value={manualOrderDueDays} onChange={(e) => setManualOrderDueDays(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-due" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Complexity (1-5)</label>
              <Select value={manualOrderComplexity} onValueChange={setManualOrderComplexity}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
            <Input placeholder="Additional details..." value={manualOrderNotes} onChange={(e) => setManualOrderNotes(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-notes" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setManualOrderSendToGrinders(!manualOrderSendToGrinders)}
                className="flex items-center gap-2"
                data-testid="toggle-send-to-grinders"
              >
                {manualOrderSendToGrinders
                  ? <ToggleRight className="w-8 h-5 text-emerald-400" />
                  : <ToggleLeft className="w-8 h-5 text-muted-foreground" />
                }
              </button>
              <div>
                <span className={`text-sm font-medium ${manualOrderSendToGrinders ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {manualOrderSendToGrinders ? "Send to Grinders" : "Manual Assign Only"}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {manualOrderSendToGrinders
                    ? "Grinders will see this order and can submit bids from their dashboard"
                    : "Only staff sees this order. Use Override Assign below to assign a grinder"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={manualOrderIsRush} onChange={(e) => setManualOrderIsRush(e.target.checked)} className="rounded" data-testid="checkbox-manual-rush" />
                <Zap className="w-3 h-3 text-red-400" />
                Rush
              </label>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
            disabled={!manualOrderService || !manualOrderPrice || createManualOrderMutation.isPending}
            data-testid="button-create-manual-order"
            onClick={() => {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + Number(manualOrderDueDays || 3));
              createManualOrderMutation.mutate({
                id: `MO-${Date.now().toString(36)}`,
                serviceId: manualOrderService,
                customerPrice: manualOrderPrice,
                platform: manualOrderPlatform || null,
                gamertag: manualOrderGamertag || null,
                orderDueDate: dueDate.toISOString(),
                isRush: manualOrderIsRush,
                isEmergency: false,
                complexity: Number(manualOrderComplexity),
                notes: manualOrderNotes || null,
                isManual: true,
                visibleToGrinders: manualOrderSendToGrinders,
                status: "Open",
              });
            }}
          >
            {createManualOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Order
          </Button>
        </CardContent>
      </Card>
      </FadeInUp>

      {assignableOrders.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-900/[0.04] overflow-hidden relative" data-testid="card-staff-assign">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              Staff Override Assign
              <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">{assignableOrders.length} assignable</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Select Order</label>
                  <Select value={assignOrderId} onValueChange={(v) => { setAssignOrderId(v); setAssignGrinderId(""); setAssignBidAmount(""); }}>
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-assign-order">
                      <SelectValue placeholder="Choose an order to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableOrders.map(o => {
                        const svc = allServices.find(s => s.id === o.serviceId);
                        return (
                          <SelectItem key={o.id} value={o.id}>
                            {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {svc?.name || o.serviceId} ({o.status})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Assign To Grinder</label>
                  <Select value={assignGrinderId} onValueChange={(v) => {
                    setAssignGrinderId(v);
                    const existingBid = orderBids.find(b => b.grinderId === v && b.status === "Pending");
                    if (existingBid) setAssignBidAmount(existingBid.bidAmount);
                  }}>
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-assign-grinder">
                      <SelectValue placeholder="Choose a grinder" />
                    </SelectTrigger>
                    <SelectContent>
                      {allGrinders.map(g => {
                        const hasBid = orderBids.some(b => b.grinderId === g.id && b.status === "Pending");
                        return (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g.activeOrders}/{g.capacity}){hasBid ? " - has bid" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedOrder && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Order Details</span>
                    <Badge variant="outline" className="text-[10px]">{selectedOrder.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Price: </span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(Number(selectedOrder.customerPrice))}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Platform: </span>
                      <span>{selectedOrder.platform || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Bids: </span>
                      <span className="text-blue-400 font-semibold">{orderBids.length}</span>
                    </div>
                  </div>
                  {orderBids.length > 0 && (
                    <div className="space-y-1 mt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Existing bids:</span>
                      {orderBids.filter(b => b.status === "Pending").map(b => {
                        const bidGrinder = allGrinders.find(g => g.id === b.grinderId);
                        return (
                          <div key={b.id} className="flex items-center justify-between flex-wrap gap-2 text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]" data-testid={`bid-option-${b.id}`}>
                            <span className="font-medium">{bidGrinder?.name || b.grinderId}</span>
                            <span className="text-emerald-400 font-semibold">{formatCurrency(Number(b.bidAmount))}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Grinder Pay Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount to pay grinder"
                    value={assignBidAmount}
                    onChange={(e) => setAssignBidAmount(e.target.value)}
                    className="bg-background/50 border-white/10"
                    data-testid="input-assign-amount"
                  />
                  {selectedOrder && assignBidAmount && (
                    <div className="text-[10px] text-muted-foreground">
                      Margin: <span className={Number(selectedOrder.customerPrice) - Number(assignBidAmount) >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                        {formatCurrency(Number(selectedOrder.customerPrice) - Number(assignBidAmount))}
                      </span>
                      {" "}({Number(selectedOrder.customerPrice) > 0 ? (((Number(selectedOrder.customerPrice) - Number(assignBidAmount)) / Number(selectedOrder.customerPrice)) * 100).toFixed(1) : 0}%)
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
                  <Input
                    placeholder="Reason for override assignment"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="bg-background/50 border-white/10"
                    data-testid="input-assign-notes"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  data-testid="button-staff-assign"
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
                  disabled={!assignOrderId || !assignGrinderId || !assignBidAmount || staffAssignMutation.isPending}
                  onClick={() => {
                    staffAssignMutation.mutate({
                      orderId: assignOrderId,
                      grinderId: assignGrinderId,
                      bidAmount: assignBidAmount,
                      notes: assignNotes || undefined,
                    });
                  }}
                >
                  {staffAssignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
                  Assign Grinder
                </Button>
                {selectedGrinder && (
                  <span className="text-xs text-muted-foreground">
                    Assigning <span className="text-cyan-400 font-medium">{selectedGrinder.name}</span> to order{" "}
                    <span className="text-cyan-400 font-medium">{selectedOrder?.mgtOrderNumber ? `#${selectedOrder.mgtOrderNumber}` : assignOrderId}</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-900/[0.04] overflow-hidden relative" data-testid="card-link-ticket">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-500/[0.04] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-purple-400" />
            </div>
            Link Discord Ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Select Assigned Order</label>
                <Select value={ticketOrderId} onValueChange={(v) => { setTicketOrderId(v); setTicketChannelId(""); }}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-ticket-order">
                    <SelectValue placeholder="Choose an assigned order" />
                  </SelectTrigger>
                  <SelectContent>
                    {allOrders.filter(o => o.status === "Assigned" || o.status === "In Progress").map(o => {
                      const svc = allServices.find(s => s.id === o.serviceId);
                      const grinder = allGrinders.find(g => g.id === o.assignedGrinderId);
                      return (
                        <SelectItem key={o.id} value={o.id}>
                          {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {svc?.name || o.serviceId} {grinder ? `(${grinder.name})` : ""} {(o as any).discordTicketChannelId ? "[Linked]" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Discord Channel ID</label>
                <Input
                  placeholder="Paste the ticket channel ID"
                  value={ticketChannelId}
                  onChange={(e) => setTicketChannelId(e.target.value)}
                  className="bg-background/50 border-white/10"
                  data-testid="input-ticket-channel-id"
                />
              </div>
            </div>

            {ticketOrderId && (() => {
              const order = allOrders.find(o => o.id === ticketOrderId);
              const existingTicket = (order as any)?.discordTicketChannelId;
              return existingTicket ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300">Ticket linked: <span className="font-mono text-xs">{existingTicket}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-purple-300 hover:text-purple-200"
                      data-testid="button-view-ticket"
                      onClick={async () => {
                        try {
                          const res = await apiRequest("POST", `/api/orders/${ticketOrderId}/ticket-invite`);
                          const data = await res.json();
                          if (data.inviteUrl) window.open(data.inviteUrl, '_blank');
                          else if (data.channelUrl) window.open(data.channelUrl, '_blank');
                        } catch {
                          window.open(`https://discord.com/channels/@me/${existingTicket}`, '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-red-400 hover:text-red-300"
                      disabled={unlinkTicketMutation.isPending}
                      onClick={() => unlinkTicketMutation.mutate(ticketOrderId)}
                      data-testid="button-unlink-ticket"
                    >
                      <Unlink className="w-3 h-3" /> Unlink
                    </Button>
                  </div>
                </div>
              ) : null;
            })()}

            <Button
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
              disabled={!ticketOrderId || !ticketChannelId || linkTicketMutation.isPending}
              data-testid="button-link-ticket"
              onClick={() => {
                linkTicketMutation.mutate({
                  orderId: ticketOrderId,
                  discordTicketChannelId: ticketChannelId,
                });
              }}
            >
              {linkTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
              Link Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-900/[0.04] overflow-hidden relative" data-testid="card-alert-composer">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.04] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            Alert Composer
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Input
                placeholder="Alert title"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="bg-background/50 border-white/10"
                data-testid="input-alert-title"
              />
              <Textarea
                placeholder="Alert message"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="resize-none bg-background/50 border-white/10 min-h-[80px]"
                data-testid="input-alert-message"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={alertSeverity} onValueChange={setAlertSeverity}>
                  <SelectTrigger className="w-32 bg-background/50 border-white/10" data-testid="select-alert-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="danger">Danger</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertTarget} onValueChange={setAlertTarget}>
                  <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-alert-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grinders</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                {alertTarget === "individual" && (
                  <Select value={alertGrinderId} onValueChange={setAlertGrinderId}>
                    <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-alert-grinder">
                      <SelectValue placeholder="Select grinder" />
                    </SelectTrigger>
                    <SelectContent>
                      {allGrinders.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
                disabled={!alertTitle || !alertMessage || alertMutation.isPending}
                data-testid="button-send-alert"
                onClick={() => {
                  alertMutation.mutate({
                    targetType: alertTarget,
                    grinderId: alertTarget === "individual" ? alertGrinderId : undefined,
                    title: alertTitle,
                    message: alertMessage,
                    severity: alertSeverity,
                  });
                  setAlertTitle("");
                  setAlertMessage("");
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Alert
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent Alerts</p>
                <Badge variant="outline" className="text-[10px]">{(staffAlertsList || []).length}</Badge>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(!staffAlertsList || staffAlertsList.length === 0) && (
                  <div className="p-6 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]">
                    No alerts sent yet
                  </div>
                )}
                {(staffAlertsList || []).slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group" data-testid={`card-alert-${a.id}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      a.severity === "danger" ? "bg-red-400" :
                      a.severity === "warning" ? "bg-amber-400" :
                      a.severity === "success" ? "bg-emerald-400" :
                      "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{a.title}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">{a.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {a.targetType === "all" ? "All grinders" : "Individual"} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0"
                      onClick={() => deleteAlertMutation.mutate(a.id)}
                      data-testid={`button-delete-alert-${a.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      {isOwner && !embedded && (
        <>
          <FadeInUp>
            <ServiceManagement services={allServices} />
          </FadeInUp>
          <FadeInUp>
            <DeletionRequestsPanel />
          </FadeInUp>
          <FadeInUp>
            <ClearDataPanel />
          </FadeInUp>
        </>
      )}
    </div>
  );

  if (embedded) return content;
  return <AnimatedPage>{content}</AnimatedPage>;
}

export { ServiceManagement, DeletionRequestsPanel, ClearDataPanel };

export default function StaffOperations() {
  return <OperationsContent />;
}
