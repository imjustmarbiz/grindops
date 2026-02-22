import { useState } from "react";
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
import { Plus, ListOrdered, DollarSign, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Service } from "@shared/schema";

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

export default function Orders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: services } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-orders-title">
            <ListOrdered className="w-8 h-8 text-primary" /> Order Management
          </h1>
          <p className="text-muted-foreground mt-1">Track customer orders from MGT Bot and manually created.</p>
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
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : orders && orders.length > 0 ? orders.map((order: Order) => {
              const service = (services || []).find((s: Service) => s.id === order.serviceId);
              return (
                <TableRow key={order.id} className="hover:bg-white/[0.02]" data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`text-order-id-${order.id}`}>
                    {order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{service?.name || order.serviceId}</span>
                      <div className="flex gap-1">
                        {order.isRush && <Badge variant="destructive" className="text-[10px] h-4">RUSH</Badge>}
                        {order.isEmergency && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] h-4"><AlertTriangle className="w-2 h-2 mr-0.5" />EMERGENCY</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.platform ? (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400">{order.platform}</Badge>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">{order.gamertag || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="text-sm">{order.orderDueDate ? format(new Date(order.orderDueDate), "MMM d, yyyy") : "N/A"}</TableCell>
                  <TableCell className="text-right font-bold text-green-400">${order.customerPrice}</TableCell>
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
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No orders yet. Orders will appear when MGT Bot posts in the bid war channel.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
