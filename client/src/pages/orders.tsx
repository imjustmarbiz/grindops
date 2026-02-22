import { useState } from "react";
import { useOrders, useCreateOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useServices } from "@/hooks/use-services";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, ListOrdered, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  serviceId: z.string().min(1, "Service is required"),
  customerPrice: z.coerce.number().min(1, "Price must be > 0").transform(String),
  orderDueDate: z.string().min(1, "Date is required").transform(str => new Date(str)),
  complexity: z.coerce.number().min(1).max(5),
  isRush: z.boolean().default(false),
  location: z.string().optional(),
});

export default function Orders() {
  const { data: orders, isLoading } = useOrders();
  const { data: services } = useServices();
  const createMutation = useCreateOrder();
  const statusMutation = useUpdateOrderStatus();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: `O${Math.floor(Math.random() * 10000)}`,
      complexity: 1,
      isRush: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Order created successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus }, {
      onSuccess: () => toast({ title: "Status updated" }),
      onError: () => toast({ title: "Update failed", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-orders-title">
            <ListOrdered className="w-8 h-8 text-primary" /> Order Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage customer requests from MGT Bot.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover-elevate">
              <Plus className="w-4 h-4" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border/50 sm:max-w-[500px]">
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
                          {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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

                <div className="grid grid-cols-2 gap-4 items-center">
                  <FormField control={form.control} name="complexity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complexity (1-5)</FormLabel>
                      <FormControl><Input type="number" min="1" max="5" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isRush" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3 pt-4 shadow-sm">
                      <FormLabel className="text-sm">Rush Order</FormLabel>
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

      <Card className="glass-panel border-border/50">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>MGT #</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Gamertag</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : orders && orders.length > 0 ? orders.map(order => {
              const service = services?.find(s => s.id === order.serviceId);
              return (
                <TableRow key={order.id} className="hover:bg-white/[0.02]" data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`text-order-id-${order.id}`}>
                    {order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{service?.name || order.serviceId}</span>
                      {order.isRush && <Badge variant="destructive" className="w-fit text-[10px] h-4 mt-1">RUSH</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.platform ? (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400" data-testid={`text-platform-${order.id}`}>
                        {order.platform}
                      </Badge>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm" data-testid={`text-gamertag-${order.id}`}>
                    {order.gamertag || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>{order.orderDueDate ? format(new Date(order.orderDueDate), "MMM d, yyyy") : "N/A"}</TableCell>
                  <TableCell className="font-bold text-green-400">${order.customerPrice}</TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs bg-background/50 border-white/10" data-testid={`select-status-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary transition-colors hover-elevate">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
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
