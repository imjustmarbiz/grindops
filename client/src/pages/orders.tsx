import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, ListOrdered, DollarSign, AlertTriangle, Pencil, Check, X, Trash2, User, MapPin, StickyNote, Gauge } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Service, Grinder } from "@shared/schema";

const formSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  serviceId: z.string().min(1, "Service is required"),
  customerPrice: z.coerce.number().min(1, "Price must be > 0").transform(String),
  orderDueDate: z.string().min(1, "Date is required").transform((str: string) => new Date(str)),
  complexity: z.coerce.number().min(1).max(5),
  isRush: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  location: z.string().optional(),
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
          className="h-7 text-sm bg-background/50 w-28"
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
        className="text-sm bg-background/50 w-44"
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

export default function Orders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: services } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
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
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
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
    createMutation.mutate(values, {
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

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-orders-title">
            <ListOrdered className="w-8 h-8 text-primary" /> Order Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and edit customer orders. Click any field to edit inline.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/50 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">New Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl><Input {...field} className="bg-background/50" data-testid="input-order-id" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50" data-testid="select-service"><SelectValue placeholder="Select service" /></SelectTrigger>
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
                      <FormControl><Input type="number" step="0.01" {...field} className="bg-background/50" data-testid="input-price" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="orderDueDate" render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} value={value instanceof Date ? value.toISOString().slice(0, 16) : (value || "")} className="bg-background/50" data-testid="input-due-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <FormField control={form.control} name="complexity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complexity</FormLabel>
                      <FormControl><Input type="number" min="1" max="5" {...field} className="bg-background/50" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isRush" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-3 pt-4">
                      <FormLabel className="text-sm">Rush</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isEmergency" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-3 pt-4">
                      <FormLabel className="text-sm">Emergency</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Retail, Online" className="bg-background/50" data-testid="input-location" /></FormControl>
                  </FormItem>
                )} />

                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-4 bg-primary hover:bg-primary/90" data-testid="button-submit-order">
                  {createMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>MGT #</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Gamertag</TableHead>
              <TableHead className="text-center">Cx</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={11} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : orders && orders.length > 0 ? orders.map((order: Order) => {
              const service = (services || []).find((s: Service) => s.id === order.serviceId);
              const assignedGrinder = order.assignedGrinderId ? (grinders || []).find((g: Grinder) => g.id === order.assignedGrinderId) : null;
              return (
                <TableRow key={order.id} className="hover:bg-white/[0.02]" data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`text-order-id-${order.id}`}>
                    <div className="flex flex-col">
                      <span>{order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}</span>
                      {order.createdAt && <span className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), "MMM d")}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Select
                        value={order.serviceId}
                        onValueChange={(val) => saveField(order.id, { serviceId: val })}
                      >
                        <SelectTrigger className="h-7 text-sm bg-transparent border-transparent hover:border-border/50 hover:bg-white/5 w-auto min-w-[100px] -mx-1 transition-colors" data-testid={`select-edit-service-${order.id}`}>
                          <SelectValue>{service?.name || order.serviceId}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(services || []).map((s: Service) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`text-[10px] h-4 px-1.5 rounded-sm border transition-colors cursor-pointer ${order.isRush ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "bg-transparent text-muted-foreground border-dashed border-white/10 hover:border-white/30 hover:text-foreground"}`}
                              onClick={() => saveField(order.id, { isRush: !order.isRush })}
                              data-testid={`toggle-rush-${order.id}`}
                            >
                              {order.isRush ? "RUSH" : "rush"}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Click to toggle rush</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`text-[10px] h-4 px-1.5 rounded-sm border transition-colors cursor-pointer ${order.isEmergency ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" : "bg-transparent text-muted-foreground border-dashed border-white/10 hover:border-white/30 hover:text-foreground"}`}
                              onClick={() => saveField(order.id, { isEmergency: !order.isEmergency })}
                              data-testid={`toggle-emergency-${order.id}`}
                            >
                              {order.isEmergency ? "EMRG" : "emrg"}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Click to toggle emergency</TooltipContent>
                        </Tooltip>
                        <InlineTextEdit value={order.location} orderId={order.id} field="location" placeholder="loc" onSave={saveField} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineTextEdit value={order.platform} orderId={order.id} field="platform" placeholder="Platform" onSave={saveField} />
                  </TableCell>
                  <TableCell>
                    <InlineTextEdit value={order.gamertag} orderId={order.id} field="gamertag" placeholder="Gamertag" onSave={saveField} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={String(order.complexity)}
                      onValueChange={(val) => saveField(order.id, { complexity: Number(val) })}
                    >
                      <SelectTrigger className={`h-7 w-14 text-sm bg-transparent border-transparent hover:border-border/50 hover:bg-white/5 mx-auto transition-colors font-mono font-bold ${complexityColor(order.complexity)}`} data-testid={`select-edit-complexity-${order.id}`}>
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
                  <TableCell>
                    {assignedGrinder ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-primary" />
                        <span className="text-sm font-medium">{assignedGrinder.name}</span>
                      </div>
                    ) : order.assignedGrinderId ? (
                      <span className="text-xs text-muted-foreground">{order.assignedGrinderId}</span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <InlineDateEdit value={order.orderDueDate} orderId={order.id} onSave={saveField} />
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
                          className="w-24 h-7 text-sm text-right bg-background/50"
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
                          className="h-6 w-6 text-red-400 hover:text-red-300"
                          onClick={() => setEditingPriceId(null)}
                          data-testid={`button-cancel-price-${order.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 group">
                        <span className="font-bold text-green-400" data-testid={`text-price-${order.id}`}>
                          ${order.customerPrice}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                          onClick={() => { setEditingPriceId(order.id); setEditPriceValue(String(order.customerPrice)); }}
                          data-testid={`button-edit-price-${order.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.companyProfit ? (
                      <span className="font-medium text-emerald-400"><DollarSign className="w-3 h-3 inline" />{Number(order.companyProfit).toFixed(2)}</span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) => statusMutation.mutate({ id: order.id, status: val })}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs bg-background/50 border-white/10" data-testid={`select-status-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-red-400"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Delete order ${order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}? This will also remove its bids and assignments.`)) {
                          deleteMutation.mutate(order.id);
                        }
                      }}
                      data-testid={`button-delete-order-${order.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                  No orders yet. Orders will appear when MGT Bot posts in the bid war channel.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
    </TooltipProvider>
  );
}
