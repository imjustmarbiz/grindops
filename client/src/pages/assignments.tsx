import { useState } from "react";
import { useAssignments, useCreateAssignment } from "@/hooks/use-assignments";
import { useOrders } from "@/hooks/use-orders";
import { useGrinders } from "@/hooks/use-grinders";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  grinderId: z.string().min(1),
  dueDateTime: z.string().min(1).transform(str => new Date(str)),
  status: z.string().default("Active"),
});

export default function Assignments() {
  const { data: assignments, isLoading } = useAssignments();
  const { data: orders } = useOrders();
  const { data: grinders } = useGrinders();
  const createMutation = useCreateAssignment();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: `A${Math.floor(Math.random() * 10000)}`,
      status: "Active",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Assignment created" });
      },
      onError: (err) => {
        toast({ title: "Creation failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-assignments-title">
            <FileCheck className="w-8 h-8 text-primary" /> Assignments
          </h1>
          <p className="text-muted-foreground mt-1">Auto-created when staff accepts bids via MGT Bot.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 hover-elevate" data-testid="button-force-assign">
              <Plus className="w-4 h-4" /> Force Assign
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border/50">
            <DialogHeader>
              <DialogTitle className="font-display">Create Assignment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment ID</FormLabel>
                    <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="orderId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select order" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {orders?.filter(o => o.status !== 'Completed').map(o => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="grinderId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grinder</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select grinder" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {grinders?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dueDateTime" render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Due Date/Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} value={value instanceof Date ? value.toISOString().slice(0, 16) : (value || "")} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-4" data-testid="button-submit-assignment">
                  {createMutation.isPending ? "Assigning..." : "Assign"}
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
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : assignments && assignments.length > 0 ? assignments.map(a => {
              const grinder = grinders?.find(g => g.id === a.grinderId);
              const order = orders?.find(o => o.id === a.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId;
              return (
                <TableRow key={a.id} className="hover:bg-white/[0.02]" data-testid={`row-assignment-${a.id}`}>
                  <TableCell className="font-mono text-muted-foreground" data-testid={`text-assignment-id-${a.id}`}>{a.id}</TableCell>
                  <TableCell className="font-bold text-primary" data-testid={`text-assignment-order-${a.id}`}>{orderRef}</TableCell>
                  <TableCell className="font-medium" data-testid={`text-assignment-grinder-${a.id}`}>{grinder?.name || a.grinderId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(a.assignedDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-orange-400 font-medium">{format(new Date(a.dueDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-right">
                    {a.margin ? (
                      <span className="text-accent font-medium" data-testid={`text-assignment-margin-${a.id}`}>
                        ${a.margin} ({a.marginPct}%)
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'Active' ? 'default' : 'secondary'} className={a.status === 'Active' ? 'bg-primary/20 text-primary border-primary/30' : ''} data-testid={`badge-assignment-status-${a.id}`}>
                      {a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No assignments yet. Assignments are auto-created when staff accepts bids in Discord.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
