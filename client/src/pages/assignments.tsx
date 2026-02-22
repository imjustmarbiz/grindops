import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileCheck, DollarSign, Users, CheckCircle, Clock, Star, AlertTriangle, UserMinus, ArrowRight, Repeat, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Assignment, Order, Grinder } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function Assignments() {
  const queryClient = useQueryClient();
  const { data: assignments, isLoading } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 10000 });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 10000 });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 10000 });
  const { toast } = useToast();

  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [replacementGrinderId, setReplacementGrinderId] = useState("");
  const [originalPay, setOriginalPay] = useState("");
  const [replacementPay, setReplacementPay] = useState("");
  const [reason, setReason] = useState("");

  const replaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("POST", `/api/assignments/${id}/replace`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs?limit=15"] });
      setReplaceDialogOpen(false);
      setSelectedAssignment(null);
      toast({ title: "Grinder replaced successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to replace grinder", description: err.message, variant: "destructive" });
    },
  });

  const openReplaceDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const totalPay = Number(assignment.grinderEarnings || assignment.bidAmount || 0);
    setOriginalPay("0");
    setReplacementPay(totalPay.toFixed(2));
    setReplacementGrinderId("");
    setReason("");
    setReplaceDialogOpen(true);
  };

  const handleReplace = () => {
    if (!selectedAssignment || !replacementGrinderId) return;
    replaceMutation.mutate({
      id: selectedAssignment.id,
      data: {
        replacementGrinderId,
        originalGrinderPay: originalPay || "0",
        replacementGrinderPay: replacementPay || "0",
        reason: reason || undefined,
      },
    });
  };

  const totalPay = Number(selectedAssignment?.grinderEarnings || selectedAssignment?.bidAmount || 0);
  const origPayNum = parseFloat(originalPay) || 0;
  const replPayNum = parseFloat(replacementPay) || 0;
  const totalSplit = origPayNum + replPayNum;
  const companyKeeps = totalPay - totalSplit;

  const active = (assignments || []).filter(a => a.status === "Active");
  const completed = (assignments || []).filter(a => a.status === "Completed");
  const replaced = (assignments || []).filter(a => a.wasReassigned);
  const totalGrinderPay = (assignments || []).reduce((sum, a) => sum + (Number(a.grinderEarnings) || 0), 0);
  const totalOriginalPay = (assignments || []).reduce((sum, a) => sum + (Number(a.originalGrinderPay) || 0), 0);
  const totalReplacementPay = (assignments || []).reduce((sum, a) => sum + (Number(a.replacementGrinderPay) || 0), 0);
  const totalProfit = (assignments || []).reduce((sum, a) => sum + (Number(a.companyProfit) || 0), 0);

  const availableGrinders = (grinders || []).filter(g => {
    if (!selectedAssignment) return true;
    return g.id !== selectedAssignment.grinderId && g.activeOrders < g.capacity;
  });

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-assignments-title">
          <FileCheck className="w-8 h-8 text-primary" /> Assignments
        </h1>
        <p className="text-muted-foreground mt-1">Auto-created when bids are accepted. Replace grinders with custom pay splits.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold" data-testid="text-active-assignments">{active.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold" data-testid="text-completed-assignments">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Repeat className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-xl font-bold text-amber-400" data-testid="text-replaced-count">{replaced.length}</p>
              <p className="text-xs text-muted-foreground">Replaced</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-blue-400" data-testid="text-total-grinder-pay">{formatCurrency(totalGrinderPay + totalOriginalPay)}</p>
              <p className="text-xs text-muted-foreground">Grinder Pay</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-emerald-400" data-testid="text-total-profit">{formatCurrency(totalProfit)}</p>
              <p className="text-xs text-muted-foreground">Company Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead className="text-right">Order Price</TableHead>
              <TableHead className="text-right">Grinder Pay</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-center">Quality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={13} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : assignments && assignments.length > 0 ? assignments.map((a: Assignment) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === a.grinderId);
              const originalGrinder = a.originalGrinderId ? (grinders || []).find((g: Grinder) => g.id === a.originalGrinderId) : null;
              const order = (orders || []).find((o: Order) => o.id === a.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId;
              return (
                <TableRow key={a.id} className="hover:bg-white/[0.02]" data-testid={`row-assignment-${a.id}`}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="font-bold text-primary">{orderRef}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{grinder?.name || a.grinderId}</span>
                      {grinder && <p className="text-xs text-muted-foreground">{grinder.category}</p>}
                      {a.wasReassigned && originalGrinder && (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 gap-0.5">
                                <UserMinus className="w-2 h-2" />
                                Replaced {originalGrinder.name}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">Replacement Details</p>
                            <p className="text-xs">Original: {originalGrinder.name} ({formatCurrency(Number(a.originalGrinderPay || 0))})</p>
                            <p className="text-xs">Replacement: {grinder?.name} ({formatCurrency(Number(a.replacementGrinderPay || 0))})</p>
                            {a.replacementReason && <p className="text-xs mt-1">Reason: {a.replacementReason}</p>}
                            {a.replacedAt && <p className="text-xs text-muted-foreground">Replaced: {format(new Date(a.replacedAt), "MMM d, h:mm a")}</p>}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(a.assignedDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-sm text-orange-400">{format(new Date(a.dueDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell>
                    {a.deliveredDateTime ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{format(new Date(a.deliveredDateTime), "MMM d, h:mm a")}</span>
                        {a.isOnTime !== null && a.isOnTime !== undefined && (
                          <Badge variant="outline" className={`text-[10px] w-fit mt-0.5 ${a.isOnTime ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
                            {a.isOnTime ? "On Time" : "Late"}
                          </Badge>
                        )}
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{a.orderPrice ? `$${a.orderPrice}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    {a.wasReassigned ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-blue-400">{a.replacementGrinderPay ? `$${a.replacementGrinderPay}` : "-"}</span>
                            {a.originalGrinderPay && Number(a.originalGrinderPay) > 0 && (
                              <span className="text-[10px] text-amber-400">+${a.originalGrinderPay} orig</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Replacement: {formatCurrency(Number(a.replacementGrinderPay || 0))}</p>
                          <p>Original grinder: {formatCurrency(Number(a.originalGrinderPay || 0))}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="font-medium text-blue-400">{a.grinderEarnings ? `$${a.grinderEarnings}` : a.bidAmount ? `$${a.bidAmount}` : "-"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.margin ? (
                      <span className="font-medium text-emerald-400">
                        ${a.margin}
                        {a.marginPct && <span className="text-xs text-muted-foreground ml-1">({a.marginPct}%)</span>}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">{a.companyProfit ? `$${a.companyProfit}` : "-"}</TableCell>
                  <TableCell className="text-center">
                    {a.qualityRating ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center justify-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="font-medium text-yellow-400">{a.qualityRating}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Quality rating: {a.qualityRating}/5</TooltipContent>
                      </Tooltip>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={a.status === "Active" ? "default" : "secondary"} className={a.status === "Active" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                        {a.status}
                      </Badge>
                      {a.wasReassigned && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 w-fit">
                          <Repeat className="w-2 h-2 mr-0.5" />Replaced
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.status === "Active" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                            onClick={() => openReplaceDialog(a)}
                            data-testid={`button-replace-grinder-${a.id}`}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Replace grinder</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={13} className="text-center h-24 text-muted-foreground">
                  No assignments yet. Assignments are auto-created when staff accepts bids in Discord.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="border-border/50 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-amber-400" />
              Replace Grinder
            </DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-5 mt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Assignment</span>
                  <span className="font-mono text-sm">{selectedAssignment.id}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="font-bold text-primary">
                    {(() => { const o = (orders || []).find(o => o.id === selectedAssignment.orderId); return o?.mgtOrderNumber ? `#${o.mgtOrderNumber}` : selectedAssignment.orderId; })()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Grinder</span>
                  <span className="font-medium text-red-400">
                    {(grinders || []).find(g => g.id === selectedAssignment.grinderId)?.name || selectedAssignment.grinderId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Grinder Pay</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(totalPay)}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Replacement Grinder</Label>
                <Select value={replacementGrinderId} onValueChange={setReplacementGrinderId}>
                  <SelectTrigger className="mt-1.5 bg-background/50" data-testid="select-replacement-grinder">
                    <SelectValue placeholder="Select a grinder to take over..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGrinders.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <span>{g.name}</span>
                          <span className="text-xs text-muted-foreground">({g.category} &middot; {g.activeOrders}/{g.capacity})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Payment Split
                </Label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Original Grinder Gets</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={originalPay}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOriginalPay(v);
                          const orig = parseFloat(v) || 0;
                          setReplacementPay(Math.max(0, totalPay - orig).toFixed(2));
                        }}
                        className="pl-7 bg-background/50"
                        data-testid="input-original-pay"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {origPayNum > 0 ? `${((origPayNum / totalPay) * 100).toFixed(0)}% of total` : "No partial pay"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Replacement Grinder Gets</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={replacementPay}
                        onChange={(e) => {
                          const v = e.target.value;
                          setReplacementPay(v);
                          const repl = parseFloat(v) || 0;
                          setOriginalPay(Math.max(0, totalPay - repl).toFixed(2));
                        }}
                        className="pl-7 bg-background/50"
                        data-testid="input-replacement-pay"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {replPayNum > 0 ? `${((replPayNum / totalPay) * 100).toFixed(0)}% of total` : "No pay allocated"}
                    </p>
                  </div>
                </div>

                <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                  {totalPay > 0 && (
                    <>
                      <div className="h-full bg-red-500/70 transition-all" style={{ width: `${(origPayNum / totalPay) * 100}%` }} />
                      <div className="h-full bg-blue-500/70 transition-all" style={{ width: `${(replPayNum / totalPay) * 100}%` }} />
                      {companyKeeps > 0.01 && <div className="h-full bg-emerald-500/70 transition-all" style={{ width: `${(companyKeeps / totalPay) * 100}%` }} />}
                    </>
                  )}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-red-400">Original: {formatCurrency(origPayNum)}</span>
                  <span className="text-blue-400">Replacement: {formatCurrency(replPayNum)}</span>
                  {companyKeeps > 0.01 && <span className="text-emerald-400">Company: {formatCurrency(companyKeeps)}</span>}
                </div>

                {totalSplit > totalPay && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Split exceeds total grinder pay by {formatCurrency(totalSplit - totalPay)}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Grinder unavailable, performance issue, scheduling conflict..."
                  className="mt-1 bg-background/50 resize-none"
                  rows={2}
                  data-testid="input-replacement-reason"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setReplaceDialogOpen(false)}
                  data-testid="button-cancel-replace"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black gap-2"
                  disabled={!replacementGrinderId || replaceMutation.isPending || totalSplit > totalPay || origPayNum < 0 || replPayNum < 0}
                  onClick={handleReplace}
                  data-testid="button-confirm-replace"
                >
                  <Repeat className="w-4 h-4" />
                  {replaceMutation.isPending ? "Replacing..." : "Replace Grinder"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
