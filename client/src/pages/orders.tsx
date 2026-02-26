import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, ListOrdered, DollarSign, AlertTriangle, Pencil, Check, X, Trash2, User, StickyNote, Gauge, Package, Clock, TrendingUp, FileText, UserMinus, RefreshCw, ShieldAlert, ShieldX, ShieldCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import type { Order, Service, Grinder, Bid } from "@shared/schema";

import { Link } from "wouter";

const formSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  serviceId: z.string().min(1, "Service is required"),
  customerPrice: z.coerce.number().min(1, "Price must be > 0").transform(String),
  orderDueDate: z.string().min(1, "Date is required").transform((str: string) => new Date(str)),
  complexity: z.coerce.number().min(1).max(5),
  isRush: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
});

function InlineTextEdit({ value, orderId, field, placeholder, onSave }: {
  value: string | null;
  orderId: string;
  field: string;
  placeholder?: string;
  onSave: (id: string, data: Record<string, any>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    const newVal = editValue.trim() || null;
    if (newVal !== (value || null)) {
      onSave(orderId, { [field]: newVal });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-sm bg-background/50 border-white/10 w-28"
          data-testid={`input-edit-${field}-${orderId}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setEditValue(value || ""); setEditing(false); }
          }}
          onBlur={save}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-1 cursor-pointer min-h-[28px] rounded px-1 -mx-1 hover:bg-white/5 transition-colors"
      onClick={() => { setEditValue(value || ""); setEditing(true); }}
      data-testid={`editable-${field}-${orderId}`}
    >
      <span className="text-sm">{value || <span className="text-muted-foreground italic text-xs">{placeholder || "—"}</span>}</span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

function InlineDateEdit({ value, orderId, onSave }: {
  value: Date | string | null;
  orderId: string;
  onSave: (id: string, data: Record<string, any>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dateStr = value ? new Date(value).toISOString().slice(0, 16) : "";
  const [editValue, setEditValue] = useState(dateStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    if (editValue && editValue !== dateStr) {
      onSave(orderId, { orderDueDate: new Date(editValue).toISOString() });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="datetime-local"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="text-sm bg-background/50 border-white/10 w-44"
        data-testid={`input-edit-duedate-${orderId}`}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setEditValue(dateStr); setEditing(false); }
        }}
        onBlur={save}
      />
    );
  }

  return (
    <div
      className="group flex items-center gap-1 cursor-pointer min-h-[28px] rounded px-1 -mx-1 hover:bg-white/5 transition-colors"
      onClick={() => { setEditValue(dateStr); setEditing(true); }}
      data-testid={`editable-duedate-${orderId}`}
    >
      <span className="text-sm">{value ? format(new Date(value), "MMM d, yyyy") : "N/A"}</span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

function InlineCompletionDateEdit({ value, orderId, orderDueDate, onSave }: {
  value: Date | string | null;
  orderId: string;
  orderDueDate: Date | string | null;
  onSave: (id: string, data: Record<string, any>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dateStr = value ? new Date(value).toISOString().slice(0, 16) : "";
  const [editValue, setEditValue] = useState(dateStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    if (editValue !== dateStr) {
      onSave(orderId, { completedAt: editValue ? new Date(editValue).toISOString() : null });
    }
    setEditing(false);
  };

  const clear = () => {
    onSave(orderId, { completedAt: null });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <Input
          ref={inputRef}
          type="datetime-local"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-sm bg-background/50 border-white/10 w-44"
          data-testid={`input-edit-completed-${orderId}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setEditValue(dateStr); setEditing(false); }
          }}
          onBlur={save}
        />
        {value && (
          <button
            className="text-[10px] text-red-400 hover:text-red-300 text-left"
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            data-testid={`button-clear-completed-${orderId}`}
          >
            Clear date
          </button>
        )}
      </div>
    );
  }

  if (!value) {
    return (
      <div
        className="group flex items-center gap-1 cursor-pointer min-h-[28px] rounded px-1 -mx-1 hover:bg-white/5 transition-colors"
        onClick={() => { setEditValue(""); setEditing(true); }}
        data-testid={`editable-completed-${orderId}`}
      >
        <span className="text-muted-foreground">-</span>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    );
  }

  const completedDate = new Date(value);
  const isOnTime = orderDueDate ? completedDate <= new Date(orderDueDate) : null;

  return (
    <div
      className="group flex flex-col cursor-pointer rounded px-1 -mx-1 hover:bg-white/5 transition-colors"
      onClick={() => { setEditValue(dateStr); setEditing(true); }}
      data-testid={`editable-completed-${orderId}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs text-emerald-400">{format(completedDate, "MMM d, yyyy")}</span>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      <span className="text-[10px] text-muted-foreground">{format(completedDate, "h:mm a")}</span>
      {isOnTime === true && <span className="text-[10px] text-emerald-400 font-medium">On Time</span>}
      {isOnTime === false && <span className="text-[10px] text-red-400 font-medium">Late</span>}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 10000 });
  const { data: services } = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 30000 });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 10000 });
  const { data: bids } = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 10000 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [briefOrder, setBriefOrder] = useState<Order | null>(null);
  const [briefText, setBriefText] = useState("");
  const [briefLink, setBriefLink] = useState("");
  const [reassignOrder, setReassignOrder] = useState<Order | null>(null);
  const [reassignGrinderId, setReassignGrinderId] = useState("");
  const [reassignPayAmount, setReassignPayAmount] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [deleteRequestOrder, setDeleteRequestOrder] = useState<Order | null>(null);
  const [deleteRequestReason, setDeleteRequestReason] = useState("");
  const [replacementPromptOrder, setReplacementPromptOrder] = useState<Order | null>(null);
  const [replacementAction, setReplacementAction] = useState<"strike" | "warning" | "no_penalty">("no_penalty");
  const [replacementReason, setReplacementReason] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, replacementAction: rAction, replacementReason: rReason }: { id: string; status: string; replacementAction?: string; replacementReason?: string }) => {
      const body: any = { status };
      if (rAction) body.replacementAction = rAction;
      if (rReason) body.replacementReason = rReason;
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, body);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      if (variables.replacementAction === "strike") {
        toast({ title: "Grinder replaced with strike", description: "A strike and fine have been applied." });
      } else if (variables.replacementAction === "warning") {
        toast({ title: "Grinder replaced with warning", description: "A formal warning has been sent." });
      } else if (variables.status === "Need Replacement") {
        toast({ title: "Grinder replaced", description: "No penalties applied." });
      }
      setReplacementPromptOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/orders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Order deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete order", description: err.message, variant: "destructive" });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async ({ entityId, entityLabel, reason }: { entityId: string; entityLabel: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/deletion-requests", {
        entityType: "order",
        entityId,
        entityLabel,
        reason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Delete request submitted", description: "An owner will review your request." });
      setDeleteRequestOrder(null);
      setDeleteRequestReason("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    },
  });

  const priceMutation = useMutation({
    mutationFn: async ({ id, customerPrice }: { id: string; customerPrice: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/price`, { customerPrice });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      setEditingPriceId(null);
      toast({ title: "Price updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update price", description: err.message, variant: "destructive" });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({ title: "Order updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const saveField = (id: string, data: Record<string, any>) => {
    updateFieldMutation.mutate({ id, data });
  };

  const reassignMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/assign`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
      setReassignOrder(null);
      setReassignGrinderId("");
      setReassignPayAmount("");
      setReassignNotes("");
      toast({ title: "Replacement grinder assigned" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to reassign order", description: err.message, variant: "destructive" });
    },
  });

  const openReassignDialog = (order: Order) => {
    setReassignOrder(order);
    setReassignGrinderId("");
    setReassignPayAmount("");
    setReassignNotes("");
  };

  const handleReassign = () => {
    if (!reassignOrder || !reassignGrinderId || !reassignPayAmount) return;
    reassignMutation.mutate({
      orderId: reassignOrder.id,
      data: {
        grinderId: reassignGrinderId,
        bidAmount: reassignPayAmount,
        notes: reassignNotes || "Replacement grinder assigned from orders page",
      },
    });
  };

  const availableReassignGrinders = (grinders || []).filter(g => {
    if (!reassignOrder) return true;
    return g.id !== reassignOrder.assignedGrinderId && !g.suspended && !g.isRemoved;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: `O${Math.floor(Math.random() * 10000)}`,
      complexity: 1,
      isRush: false,
      isEmergency: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ ...values, isManual: true }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Order created successfully" });
      },
      onError: (err: Error) => {
        toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
      }
    });
  };

  const complexityColor = (c: number) => {
    if (c <= 1) return "text-green-400";
    if (c <= 2) return "text-emerald-400";
    if (c <= 3) return "text-yellow-400";
    if (c <= 4) return "text-orange-400";
    return "text-red-400";
  };

  const { sortedItems: sortedOrders, sortKey: currentSortKey, sortDir: currentSortDir, toggleSort } = useTableSort<Order>(orders || []);

  const openCount = (orders || []).filter(o => o.status === "Open").length;
  const assignedCount = (orders || []).filter(o => o.status === "Assigned" || o.status === "In Progress").length;
  const completedCount = (orders || []).filter(o => o.status === "Completed").length;
  const totalRevenue = (orders || []).reduce((s, o) => s + Number(o.customerPrice || 0), 0);

  return (
    <TooltipProvider>
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-3" data-testid="text-orders-title">
            <ListOrdered className="w-7 h-7 text-primary" />
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track and edit customer orders. Click any field to edit inline.</p>
        </div>
        {(() => {
          const needsPrice = (orders || []).filter((o: Order) =>
            (!o.customerPrice || Number(o.customerPrice) <= 0) &&
            (o.status === "Assigned" || o.status === "In Progress" || o.status === "Completed")
          );
          if (needsPrice.length === 0) return null;
          return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400" data-testid="banner-orders-need-price">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">
                {needsPrice.length} assigned order{needsPrice.length > 1 ? "s" : ""} missing price — margins cannot be calculated.
                Set price to proceed.
              </span>
            </div>
          );
        })()}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order" className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 sm:hover:-translate-y-0.5 transition-all duration-300">
              <Plus className="w-4 h-4" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                New Order
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl><Input {...field} className="bg-background/50 border-white/10" data-testid="input-order-id" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-service"><SelectValue placeholder="Select service" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(services || []).map((s: Service) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="customerPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} className="bg-background/50 border-white/10" data-testid="input-price" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="orderDueDate" render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} value={value instanceof Date ? value.toISOString().slice(0, 16) : (value || "")} className="bg-background/50 border-white/10" data-testid="input-due-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <FormField control={form.control} name="complexity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complexity</FormLabel>
                      <FormControl><Input type="number" min="1" max="5" {...field} className="bg-background/50 border-white/10" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isRush" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 p-3 pt-4">
                      <FormLabel className="text-sm">Rush</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isEmergency" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 p-3 pt-4">
                      <FormLabel className="text-sm">Emergency</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20" data-testid="button-submit-order">
                  {createMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open", value: openCount, icon: Package, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400" },
          { label: "Assigned", value: assignedCount, icon: User, gradient: "from-amber-500/[0.08] via-background to-amber-900/[0.04]", iconBg: "bg-amber-500/15", textColor: "text-amber-400" },
          { label: "Completed", value: completedCount, icon: Check, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400" },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp, gradient: "from-purple-500/[0.08] via-background to-purple-900/[0.04]", iconBg: "bg-purple-500/15", textColor: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4 flex items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.textColor}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.textColor}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <Table className="min-w-[1200px] table-fixed w-full">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[5%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[10%]" />
            <col className="w-[4%]" />
          </colgroup>
          <TableHeader className="sticky top-0 z-10" style={{ backgroundColor: "hsl(240 10% 6.5%)" }}>
            <TableRow className="border-white/[0.06]">
              <SortableHeader label="MGT #" sortKey="mgtOrderNumber" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <SortableHeader label="Service" sortKey="serviceId" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <SortableHeader label="Platform" sortKey="platform" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <TableHead className="whitespace-nowrap">Gamertag</TableHead>
              <SortableHeader label="Cmplx" sortKey="complexity" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} className="text-center" tooltip="Order complexity rating (1-5). Higher values indicate more difficult or time-consuming orders." />
              <SortableHeader label="Assigned To" sortKey="assignedGrinderId" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <SortableHeader label="Due Date" sortKey="orderDueDate" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <SortableHeader label="Completed" sortKey="completedAt" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <SortableHeader label="Price" sortKey="customerPrice" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} className="text-right" />
              <TableHead className="text-right whitespace-nowrap">Bid</TableHead>
              <SortableHeader label="Profit" sortKey="companyProfit" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Status" sortKey="status" currentSortKey={currentSortKey} currentSortDir={currentSortDir} onToggle={toggleSort} />
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={11} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : sortedOrders && sortedOrders.length > 0 ? sortedOrders.map((order: Order) => {
              const service = (services || []).find((s: Service) => s.id === order.serviceId);
              const assignedGrinder = order.assignedGrinderId ? (grinders || []).find((g: Grinder) => g.id === order.assignedGrinderId) : null;
              const orderRowStyle =
                order.status === "Open" ? "border-l-2 border-l-blue-500/60 bg-blue-500/[0.03] hover:bg-blue-500/[0.06]" :
                order.status === "Bidding Open" ? "border-l-2 border-l-indigo-500/60 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06]" :
                order.status === "Bidding Closed" ? "border-l-2 border-l-indigo-400/40 bg-indigo-400/[0.02] hover:bg-indigo-400/[0.05]" :
                order.status === "Assigned" ? "border-l-2 border-l-amber-500/60 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]" :
                order.status === "In Progress" ? "border-l-2 border-l-purple-500/60 bg-purple-500/[0.03] hover:bg-purple-500/[0.06]" :
                order.status === "Completed" ? "border-l-2 border-l-emerald-500/60 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]" :
                order.status === "Paid Out" ? "border-l-2 border-l-cyan-500/40 opacity-60 hover:opacity-80" :
                order.status === "Cancelled" ? "border-l-2 border-l-red-500/40 opacity-40 hover:opacity-65" :
                order.status === "Need Replacement" ? "border-l-2 border-l-orange-500/60 bg-orange-500/[0.04] hover:bg-orange-500/[0.07]" :
                "hover:bg-white/[0.03]";
              return (
                <TableRow key={order.id} className={`${orderRowStyle} border-white/[0.04] transition-all`} data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`text-order-id-${order.id}`}>
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col">
                        <span>{order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}</span>
                        {order.createdAt && <span className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), "MMM d")}</span>}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${order.orderBrief ? "text-primary hover:text-primary/80 bg-primary/10" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5"}`}
                            onClick={() => {
                              setBriefOrder(order);
                              setBriefText(order.orderBrief || "");
                              setBriefLink(order.discordBidLink || "");
                            }}
                            data-testid={`button-brief-${order.id}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{order.orderBrief ? "View/Edit Brief" : "Add Brief"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <div className="flex flex-col gap-1">
                      <Select
                        value={order.serviceId}
                        onValueChange={(val) => saveField(order.id, { serviceId: val })}
                      >
                        <SelectTrigger className="h-7 text-sm bg-transparent border-transparent hover:border-white/10 hover:bg-white/5 w-full -mx-1 transition-colors" data-testid={`select-edit-service-${order.id}`}>
                          <SelectValue><span className="truncate block">{service?.name || order.serviceId}</span></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(services || []).map((s: Service) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`text-[10px] h-4 px-1.5 rounded-sm border transition-colors cursor-pointer ${!order.isRush ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30" : "bg-transparent text-muted-foreground border-dashed border-white/10 hover:border-white/30 hover:text-foreground"}`}
                              onClick={() => saveField(order.id, { isRush: false })}
                              data-testid={`toggle-standard-${order.id}`}
                            >
                              Standard
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Standard priority</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`text-[10px] h-4 px-1.5 rounded-sm border transition-colors cursor-pointer ${order.isRush ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "bg-transparent text-muted-foreground border-dashed border-white/10 hover:border-white/30 hover:text-foreground"}`}
                              onClick={() => saveField(order.id, { isRush: true })}
                              data-testid={`toggle-rush-${order.id}`}
                            >
                              Rush
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Rush priority</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={order.platform || ""} onValueChange={(val) => saveField(order.id, { platform: val || null })}>
                      <SelectTrigger className="h-7 text-xs bg-background/50 border-white/10 w-full min-w-0" data-testid={`select-platform-${order.id}`}>
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Xbox">Xbox</SelectItem>
                        <SelectItem value="PS5">PS5</SelectItem>
                        <SelectItem value="PS4">PS4</SelectItem>
                        <SelectItem value="PC">PC</SelectItem>
                        <SelectItem value="Switch">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <InlineTextEdit value={order.gamertag} orderId={order.id} field="gamertag" placeholder="Gamertag" onSave={saveField} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={String(order.complexity)}
                      onValueChange={(val) => saveField(order.id, { complexity: Number(val) })}
                    >
                      <SelectTrigger className={`h-7 w-14 text-sm bg-transparent border-transparent hover:border-white/10 hover:bg-white/5 mx-auto transition-colors font-mono font-bold ${complexityColor(order.complexity)}`} data-testid={`select-edit-complexity-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(c => (
                          <SelectItem key={c} value={String(c)}>
                            <span className={complexityColor(c)}>{c}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    {assignedGrinder ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <User className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{assignedGrinder.name}</span>
                      </div>
                    ) : order.assignedGrinderId ? (
                      <span className="text-xs text-muted-foreground truncate block">{order.assignedGrinderId}</span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <InlineDateEdit value={order.orderDueDate} orderId={order.id} onSave={saveField} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <InlineCompletionDateEdit
                      value={order.completedAt}
                      orderId={order.id}
                      orderDueDate={order.orderDueDate}
                      onSave={saveField}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {editingPriceId === order.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          className="w-24 h-7 text-sm text-right bg-background/50 border-white/10"
                          data-testid={`input-edit-price-${order.id}`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editPriceValue) {
                              priceMutation.mutate({ id: order.id, customerPrice: parseFloat(editPriceValue).toFixed(2) });
                            }
                            if (e.key === "Escape") setEditingPriceId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                          disabled={priceMutation.isPending || !editPriceValue}
                          onClick={() => priceMutation.mutate({ id: order.id, customerPrice: parseFloat(editPriceValue).toFixed(2) })}
                          data-testid={`button-save-price-${order.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground"
                          onClick={() => setEditingPriceId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : !order.customerPrice || Number(order.customerPrice) <= 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 hover:text-amber-300 animate-pulse"
                          onClick={() => { setEditingPriceId(order.id); setEditPriceValue(""); }}
                          data-testid={`button-set-price-${order.id}`}
                        >
                          <AlertTriangle className="w-3 h-3" /> Set Price Now
                        </Button>
                        {(order.status === "Assigned" || order.status === "In Progress" || order.status === "Completed") && (
                          <span className="text-[10px] text-amber-400/70">Required for margin</span>
                        )}
                      </div>
                    ) : (
                      <div
                        className="group flex items-center justify-end gap-1 cursor-pointer rounded px-1 hover:bg-white/5 transition-colors"
                        onClick={() => { setEditingPriceId(order.id); setEditPriceValue(order.customerPrice); }}
                        data-testid={`editable-price-${order.id}`}
                      >
                        <span className="text-emerald-400 font-semibold">${order.customerPrice}</span>
                        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {(() => {
                      const orderBid = (bids || []).find(b => b.orderId === order.id && b.status === "Accepted");
                      return orderBid ? (
                        <Link href="/bids">
                          <span className="text-blue-400 hover:underline cursor-pointer font-medium" data-testid={`link-bid-${order.id}`}>${orderBid.bidAmount}</span>
                        </Link>
                      ) : <span className="text-muted-foreground">-</span>;
                    })()}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {order.companyProfit ? (
                      <span className="font-semibold text-emerald-400">${order.companyProfit}</span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(val) => {
                        if (val === "Need Replacement" && order.assignedGrinderId) {
                          setReplacementPromptOrder(order);
                          setReplacementAction("no_penalty");
                          setReplacementReason("");
                          return;
                        }
                        statusMutation.mutate({ id: order.id, status: val });
                      }}
                    >
                      <SelectTrigger className={`h-7 text-xs bg-transparent border-transparent w-full ${
                        order.status === "Open" ? "text-blue-400" :
                        order.status === "Assigned" ? "text-amber-400" :
                        order.status === "In Progress" ? "text-purple-400" :
                        order.status === "Completed" ? "text-emerald-400" :
                        order.status === "Paid Out" ? "text-cyan-400" :
                        order.status === "Cancelled" ? "text-red-400" :
                        "text-muted-foreground"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Open", "Assigned", "In Progress", "Completed", "Paid Out", "Need Replacement", "Cancelled", "Bidding Closed"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center gap-1">
                      {order.status === "Need Replacement" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                              onClick={() => openReassignDialog(order)}
                              data-testid={`button-reassign-order-${order.id}`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Assign replacement grinder</TooltipContent>
                        </Tooltip>
                      )}
                      {isOwner ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-red-400"
                              onClick={() => deleteMutation.mutate(order.id)}
                              data-testid={`button-delete-order-${order.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete order</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-orange-400"
                              onClick={() => setDeleteRequestOrder(order)}
                              data-testid={`button-request-delete-order-${order.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Request deletion</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No orders yet. Orders are auto-imported from MGT Bot.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
      </FadeInUp>
    </AnimatedPage>

    <Dialog open={!!briefOrder} onOpenChange={(open) => !open && setBriefOrder(null)}>
      <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            Order Brief {briefOrder?.mgtOrderNumber ? `— #${briefOrder.mgtOrderNumber}` : ""}
          </DialogTitle>
        </DialogHeader>
        {briefOrder && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Brief / Details</label>
              <Textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                placeholder="Enter order brief details... Auto-populated from MGT Bot embeds or type manually."
                className="bg-background/50 border-white/10 min-h-[180px] text-sm"
                data-testid="input-order-brief"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Discord Bid Link (optional)</label>
              <Input
                value={briefLink}
                onChange={(e) => setBriefLink(e.target.value)}
                placeholder="https://discord.com/channels/..."
                className="bg-background/50 border-white/10"
                data-testid="input-discord-bid-link"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                data-testid="button-save-brief"
                disabled={updateFieldMutation.isPending}
                onClick={() => {
                  saveField(briefOrder.id, {
                    orderBrief: briefText || null,
                    discordBidLink: briefLink || null,
                  });
                  setBriefOrder(null);
                }}
              >
                {updateFieldMutation.isPending ? "Saving..." : "Save Brief"}
              </Button>
              <Button variant="outline" className="border-white/10" onClick={() => setBriefOrder(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={!!replacementPromptOrder} onOpenChange={(open) => { if (!open) setReplacementPromptOrder(null); }}>
      <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
            Grinder Replacement
          </DialogTitle>
        </DialogHeader>

        {replacementPromptOrder && (() => {
          const prevGrinder = (grinders || []).find((g: Grinder) => g.id === replacementPromptOrder.assignedGrinderId);
          const orderRef = replacementPromptOrder.mgtOrderNumber ? `#${replacementPromptOrder.mgtOrderNumber}` : replacementPromptOrder.id;
          return (
            <div className="space-y-5 mt-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="font-bold text-primary">{orderRef}</span>
                </div>
                {prevGrinder && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Grinder</span>
                    <span className="font-medium text-red-400">{prevGrinder.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">What action should be taken?</Label>
                <RadioGroup value={replacementAction} onValueChange={(val: any) => setReplacementAction(val)} className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${replacementAction === "no_penalty" ? "bg-emerald-500/[0.08] border-emerald-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`} data-testid="radio-no-penalty">
                    <RadioGroupItem value="no_penalty" id="no_penalty" />
                    <ShieldCheck className={`w-4 h-4 ${replacementAction === "no_penalty" ? "text-emerald-400" : "text-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium">No Penalty</div>
                      <div className="text-xs text-muted-foreground">Simply replace — no strike or warning issued</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${replacementAction === "warning" ? "bg-amber-500/[0.08] border-amber-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`} data-testid="radio-warning">
                    <RadioGroupItem value="warning" id="warning" />
                    <ShieldAlert className={`w-4 h-4 ${replacementAction === "warning" ? "text-amber-400" : "text-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium">Formal Warning</div>
                      <div className="text-xs text-muted-foreground">Notify grinder with a warning — no fine applied</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${replacementAction === "strike" ? "bg-red-500/[0.08] border-red-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`} data-testid="radio-strike">
                    <RadioGroupItem value="strike" id="strike" />
                    <ShieldX className={`w-4 h-4 ${replacementAction === "strike" ? "text-red-400" : "text-muted-foreground"}`} />
                    <div>
                      <div className="text-sm font-medium">Issue Strike</div>
                      <div className="text-xs text-muted-foreground">Add a strike with fine and suspend the grinder</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Reason {replacementAction !== "no_penalty" && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Textarea
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  placeholder="Why is this grinder being replaced?"
                  className="mt-1.5 bg-background/50 border-white/10 min-h-[80px]"
                  data-testid="input-replacement-reason"
                />
                {replacementAction !== "no_penalty" && !replacementReason.trim() && (
                  <p className="text-xs text-red-400/80 mt-1">A reason is required when issuing a strike or warning</p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="border-white/10" onClick={() => setReplacementPromptOrder(null)}>
                  Cancel
                </Button>
                <Button
                  className={
                    replacementAction === "strike" ? "bg-red-600 hover:bg-red-700 text-white" :
                    replacementAction === "warning" ? "bg-amber-600 hover:bg-amber-700 text-white" :
                    "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }
                  disabled={statusMutation.isPending || (replacementAction !== "no_penalty" && !replacementReason.trim())}
                  onClick={() => {
                    statusMutation.mutate({
                      id: replacementPromptOrder.id,
                      status: "Need Replacement",
                      replacementAction: replacementAction,
                      replacementReason: replacementReason,
                    });
                  }}
                  data-testid="button-confirm-replacement"
                >
                  {statusMutation.isPending ? "Processing..." :
                   replacementAction === "strike" ? "Replace & Strike" :
                   replacementAction === "warning" ? "Replace & Warn" :
                   "Replace — No Penalty"}
                </Button>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>

    <Dialog open={!!reassignOrder} onOpenChange={(open) => { if (!open) setReassignOrder(null); }}>
      <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-amber-400" />
            </div>
            Assign Replacement Grinder
          </DialogTitle>
        </DialogHeader>

        {reassignOrder && (
          <div className="space-y-5 mt-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Order</span>
                <span className="font-bold text-primary" data-testid="text-reassign-order-id">
                  {reassignOrder.mgtOrderNumber ? `#${reassignOrder.mgtOrderNumber}` : reassignOrder.id}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="font-medium">
                  {(services || []).find(s => s.id === reassignOrder.serviceId)?.name || reassignOrder.serviceId}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Customer Price</span>
                <span className="font-bold text-emerald-400">${reassignOrder.customerPrice}</span>
              </div>
              {reassignOrder.assignedGrinderId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Previous Grinder</span>
                  <span className="font-medium text-red-400">
                    {(grinders || []).find(g => g.id === reassignOrder.assignedGrinderId)?.name || reassignOrder.assignedGrinderId}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Replacement Grinder</Label>
              <Select value={reassignGrinderId} onValueChange={setReassignGrinderId}>
                <SelectTrigger className="mt-1.5 bg-background/50 border-white/10" data-testid="select-reassign-grinder">
                  <SelectValue placeholder="Select a grinder to take over..." />
                </SelectTrigger>
                <SelectContent>
                  {availableReassignGrinders.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        <span>{g.name}</span>
                        <span className="text-xs text-muted-foreground">({g.category} · {g.activeOrders}/{g.capacity})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Replacement Grinder Pay
              </Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={reassignPayAmount}
                  onChange={(e) => setReassignPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 bg-background/50 border-white/10"
                  data-testid="input-reassign-pay"
                />
              </div>
              {reassignPayAmount && Number(reassignPayAmount) > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Price</span>
                    <span className="text-emerald-400">${reassignOrder.customerPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Replacement Pay</span>
                    <span className="text-blue-400">${reassignPayAmount}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-1">
                    <span className="text-muted-foreground">Margin</span>
                    <span className={Number(reassignOrder.customerPrice) - Number(reassignPayAmount) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      ${(Number(reassignOrder.customerPrice) - Number(reassignPayAmount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Textarea
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                placeholder="Reason for replacement..."
                className="mt-1 resize-none bg-background/50 border-white/10"
                data-testid="input-reassign-notes"
              />
            </div>

            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20"
              disabled={!reassignGrinderId || !reassignPayAmount || reassignMutation.isPending}
              onClick={handleReassign}
              data-testid="button-confirm-reassign"
            >
              {reassignMutation.isPending ? "Assigning..." : "Confirm Replacement Assignment"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <Dialog open={!!deleteRequestOrder} onOpenChange={(open) => { if (!open) { setDeleteRequestOrder(null); setDeleteRequestReason(""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-orange-400" />
            Request Order Deletion
          </DialogTitle>
        </DialogHeader>
        {deleteRequestOrder && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <p className="text-sm font-medium">{deleteRequestOrder.id}</p>
              <p className="text-xs text-muted-foreground">
                {services?.find(s => s.id === deleteRequestOrder.serviceId)?.name || deleteRequestOrder.serviceId}
                {deleteRequestOrder.customerPrice && <span className="ml-2 text-emerald-400">${Number(deleteRequestOrder.customerPrice).toFixed(2)}</span>}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Reason for deletion *</Label>
              <Textarea
                value={deleteRequestReason}
                onChange={(e) => setDeleteRequestReason(e.target.value)}
                placeholder="Explain why this order should be deleted..."
                data-testid="input-delete-request-reason"
              />
            </div>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={!deleteRequestReason.trim() || deleteRequestMutation.isPending}
              onClick={() => deleteRequestMutation.mutate({
                entityId: deleteRequestOrder.id,
                entityLabel: `Order ${deleteRequestOrder.id}`,
                reason: deleteRequestReason,
              })}
              data-testid="button-submit-delete-request"
            >
              {deleteRequestMutation.isPending ? "Submitting..." : "Submit Delete Request"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">An owner must approve this request before the order is deleted.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
