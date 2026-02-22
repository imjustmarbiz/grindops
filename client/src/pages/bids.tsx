import { useState } from "react";
import { useBids, useCreateBid } from "@/hooks/use-bids";
import { useOrders } from "@/hooks/use-orders";
import { useGrinders } from "@/hooks/use-grinders";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  id: z.string().min(1, "ID is required"),
  orderId: z.string().min(1, "Order is required"),
  grinderId: z.string().min(1, "Grinder is required"),
  bidAmount: z.coerce.number().min(1).transform(String),
  estDeliveryDate: z.string().min(1).transform(str => new Date(str)),
  status: z.string().default("Pending"),
});

export default function Bids() {
  const { data: bids, isLoading } = useBids();
  const { data: orders } = useOrders();
  const { data: grinders } = useGrinders();
  const createMutation = useCreateBid();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: `B${Math.floor(Math.random() * 10000)}`,
      status: "Pending",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Bid placed successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to place bid", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" /> Active Bids
          </h1>
          <p className="text-muted-foreground mt-1">Review grinder proposals for open orders.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 hover-elevate">
              <Plus className="w-4 h-4" /> Place Bid
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border/50">
            <DialogHeader>
              <DialogTitle className="font-display">Place New Bid</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid ID</FormLabel>
                    <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="orderId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select order" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {orders?.filter(o => o.status === 'Open').map(o => <SelectItem key={o.id} value={o.id}>{o.id} - ${o.customerPrice}</SelectItem>)}
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="bidAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bid Amount ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="estDeliveryDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Est. Delivery</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} className="bg-background/50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full mt-4">
                  {createMutation.isPending ? "Submitting..." : "Submit Bid"}
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
              <TableHead>Bid ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead className="text-right">Bid Amount</TableHead>
              <TableHead>Est Delivery</TableHead>
              <TableHead>Time Placed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : bids?.map(bid => {
              const grinder = grinders?.find(g => g.id === bid.grinderId);
              return (
                <TableRow key={bid.id} className="hover:bg-white/[0.02]">
                  <TableCell className="font-mono text-muted-foreground">{bid.id}</TableCell>
                  <TableCell className="font-medium text-primary">{bid.orderId}</TableCell>
                  <TableCell className="font-medium">{grinder?.name || bid.grinderId}</TableCell>
                  <TableCell className="text-right font-bold text-green-400">${bid.bidAmount}</TableCell>
                  <TableCell>{format(new Date(bid.estDeliveryDate), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(bid.bidTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell>
                    <Badge variant={bid.status === 'Pending' ? 'secondary' : bid.status === 'Accepted' ? 'default' : 'destructive'}
                           className={bid.status === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                      {bid.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
