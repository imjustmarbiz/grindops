import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileCheck, DollarSign, Users, CheckCircle, Clock, Star, AlertTriangle, UserMinus, ArrowRight, Repeat, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Assignment, Order, Grinder } from "@shared/schema";
import { HelpTip } from "@/components/help-tip";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";

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
  const totalProfit = (assignments || []).reduce((sum, a) => sum + (Number(a.companyProfit) || 0), 0);

  const { sortedItems: sortedAssignments, sortKey, sortDir, toggleSort } = useTableSort<Assignment>(assignments || []);

  const availableGrinders = (grinders || []).filter(g => {
    if (!selectedAssignment) return true;
    return g.id !== selectedAssignment.grinderId && g.activeOrders < g.capacity;
  });

  return (
    <TooltipProvider>
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-3" data-testid="text-assignments-title">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            Assignments
            <HelpTip text="Track active and completed grinder assignments with pay splits and margins." />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-created when bids are accepted. Replace grinders with custom pay splits.</p>
        </div>
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Active", value: active.length, icon: Clock, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
          { label: "Completed", value: completed.length, icon: CheckCircle, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
          { label: "Replaced", value: replaced.length, icon: Repeat, gradient: "from-amber-500/[0.08] via-background to-amber-900/[0.04]", iconBg: "bg-amber-500/15", color: "text-amber-400" },
          { label: "Grinder Pay", value: formatCurrency(totalGrinderPay + totalOriginalPay), icon: Users, gradient: "from-blue-500/[0.06] via-background to-blue-900/[0.03]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
          { label: "Company Profit", value: formatCurrency(totalProfit), icon: DollarSign, gradient: "from-emerald-500/[0.06] via-background to-emerald-900/[0.03]", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/[0.02] -translate-y-5 translate-x-5" />
            <CardContent className="p-4 flex items-center gap-3 relative">
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color} truncate`} data-testid={`text-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/[0.06]">
              <SortableHeader label="ID" sortKey="id" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Order" sortKey="orderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Grinder" sortKey="grinderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Assigned" sortKey="assignedDateTime" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Due" sortKey="dueDateTime" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Delivered" sortKey="deliveredDateTime" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Order Price" sortKey="orderPrice" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Grinder Pay" sortKey="grinderEarnings" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Margin" sortKey="margin" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Profit" sortKey="companyProfit" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Quality" sortKey="qualityRating" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-center" />
              <SortableHeader label="Status" sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={13} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : sortedAssignments && sortedAssignments.length > 0 ? sortedAssignments.map((a: Assignment) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === a.grinderId);
              const originalGrinder = a.originalGrinderId ? (grinders || []).find((g: Grinder) => g.id === a.originalGrinderId) : null;
              const order = (orders || []).find((o: Order) => o.id === a.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId;
              return (
                <TableRow key={a.id} className="hover:bg-white/[0.03] border-white/[0.04] transition-colors" data-testid={`row-assignment-${a.id}`}>
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
                              <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400 bg-amber-500/10 gap-0.5">
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
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(a.assignedDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-sm text-orange-400 whitespace-nowrap">{format(new Date(a.dueDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell>
                    {a.deliveredDateTime ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{format(new Date(a.deliveredDateTime), "MMM d, h:mm a")}</span>
                        {a.isOnTime !== null && a.isOnTime !== undefined && (
                          <Badge variant="outline" className={`text-[10px] w-fit mt-0.5 border ${a.isOnTime ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : "border-red-500/20 text-red-400 bg-red-500/10"}`}>
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
                  <TableCell className="text-right whitespace-nowrap">
                    {a.margin ? (
                      <span className={`font-medium whitespace-nowrap ${parseFloat(a.margin) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ${a.margin}
                        {a.marginPct && <span className="text-xs text-muted-foreground ml-1">({a.marginPct}%)</span>}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400 whitespace-nowrap">{a.companyProfit ? `$${a.companyProfit}` : "-"}</TableCell>
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
                      <Badge variant="outline" className={`border ${a.status === "Active" ? "bg-primary/15 text-primary border-primary/20" : "bg-white/[0.03]"}`}>
                        {a.status}
                      </Badge>
                      {a.wasReassigned && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400 bg-amber-500/10 w-fit">
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
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
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
                  <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No assignments yet. Assignments are auto-created when staff accepts bids in Discord.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
      </FadeInUp>

      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <UserMinus className="w-4 h-4 text-amber-400" />
              </div>
              Replace Grinder
            </DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-5 mt-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
                  <SelectTrigger className="mt-1.5 bg-background/50 border-white/10" data-testid="select-replacement-grinder">
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
                        className="pl-7 bg-background/50 border-white/10"
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
                        className="pl-7 bg-background/50 border-white/10"
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
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
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
                  placeholder="Why is this grinder being replaced?"
                  className="mt-1 resize-none bg-background/50 border-white/10"
                  data-testid="input-replacement-reason"
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20"
                disabled={!replacementGrinderId || replaceMutation.isPending}
                onClick={handleReplace}
                data-testid="button-confirm-replace"
              >
                {replaceMutation.isPending ? "Replacing..." : "Confirm Replacement"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
    </TooltipProvider>
  );
}
