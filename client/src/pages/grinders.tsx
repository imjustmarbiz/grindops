import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Crown, Zap, Shield, AlertTriangle, Trophy, DollarSign, Target, Minus, Plus, Calendar } from "lucide-react";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Grinder } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function daysAgo(date: string | Date | null | undefined): { label: string; days: number | null } {
  if (!date) return { label: "Never", days: null };
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: "Today", days: 0 };
  if (diffDays === 1) return { label: "1 day ago", days: 1 };
  return { label: `${diffDays}d ago`, days: diffDays };
}

export default function Grinders() {
  const queryClient = useQueryClient();
  const { data: grinders, isLoading } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });
  const [selectedGrinder, setSelectedGrinder] = useState<Grinder | null>(null);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Grinder updated" });
    },
  });

  const handleStrikeChange = (grinder: Grinder, delta: number) => {
    const newStrikes = Math.max(0, Math.min(3, grinder.strikes + delta));
    updateMutation.mutate({ id: grinder.id, data: { strikes: newStrikes } });
  };

  const categorize = (g: Grinder) => g.category || "Grinder";
  const categories = ["All", "Grinder", "Elite Grinder", "VC Grinder", "Event Grinder"];

  const categoryIcon = (cat: string) => {
    if (cat === "Elite Grinder") return <Crown className="w-4 h-4 text-yellow-500" />;
    if (cat === "VC Grinder") return <Zap className="w-4 h-4 text-cyan-400" />;
    if (cat === "Event Grinder") return <Shield className="w-4 h-4 text-purple-400" />;
    return <Users className="w-4 h-4 text-primary" />;
  };

  const filterGrinders = (category: string) => {
    if (!grinders) return [];
    if (category === "All") return grinders;
    return grinders.filter(g => categorize(g) === category);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-grinders-title">
          <Users className="w-8 h-8 text-primary" /> Grinder Roster
        </h1>
        <p className="text-muted-foreground mt-1">Auto-imported from MGT Bot. Click a grinder to view their scorecard.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Grinder", count: filterGrinders("Grinder").length, icon: Users, color: "text-blue-400" },
          { label: "Elite", count: filterGrinders("Elite Grinder").length, icon: Crown, color: "text-yellow-400" },
          { label: "VC", count: filterGrinders("VC Grinder").length, icon: Zap, color: "text-cyan-400" },
          { label: "Event", count: filterGrinders("Event Grinder").length, icon: Shield, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-6 h-6 ${s.color}`} />
              <div>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="All">
        <TabsList className="bg-white/5 border border-border/50">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid={`tab-${cat.toLowerCase().replace(/\s/g, "-")}`}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <Card className="border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead>Grinder</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="text-center">Last Order</TableHead>
                    <TableHead className="text-center">Strikes</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : filterGrinders(cat).length > 0 ? filterGrinders(cat).map(g => {
                    const winRateNum = g.winRate ? Number(g.winRate) * 100 : null;
                    return (
                      <TableRow key={g.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedGrinder(g)} data-testid={`row-grinder-${g.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {categoryIcon(categorize(g))}
                            <div>
                              <span className="font-medium" data-testid={`text-grinder-name-${g.id}`}>{g.name}</span>
                              {g.discordUsername && <p className="text-xs text-muted-foreground">@{g.discordUsername}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{categorize(g)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${g.tier === "New" ? "border-cyan-500/30 text-cyan-400" : g.tier === "Pro" ? "border-yellow-500/30 text-yellow-400" : g.tier === "Elite" ? "border-purple-500/30 text-purple-400" : ""}`}>
                            {g.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={g.activeOrders >= g.capacity ? "text-red-400 font-bold" : "text-muted-foreground"}>
                            {g.activeOrders}/{g.capacity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <span className="font-medium">{g.totalOrders}</span>
                            <span className="text-xs text-muted-foreground ml-1">({g.completedOrders} done)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-400">
                          {formatCurrency(Number(g.totalEarnings))}
                        </TableCell>
                        <TableCell className="text-center">
                          {winRateNum !== null ? (
                            <span className={`font-medium ${winRateNum >= 70 ? "text-green-400" : winRateNum >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                              {winRateNum.toFixed(0)}%
                            </span>
                          ) : <span className="text-muted-foreground">N/A</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const info = daysAgo(g.lastAssigned);
                            const colorClass = info.days === null ? "text-muted-foreground" : info.days <= 3 ? "text-green-400" : info.days <= 7 ? "text-yellow-400" : "text-red-400";
                            return (
                              <div className="flex flex-col items-center">
                                <span className={`text-sm font-medium ${colorClass}`}>{info.label}</span>
                                {g.lastAssigned && (
                                  <span className="text-[10px] text-muted-foreground">{new Date(g.lastAssigned).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStrikeChange(g, -1)} disabled={g.strikes <= 0} data-testid={`button-strike-minus-${g.id}`}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="flex gap-1">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < g.strikes ? "bg-red-500" : "bg-white/10"}`} />
                              ))}
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStrikeChange(g, 1)} disabled={g.strikes >= 3} data-testid={`button-strike-plus-${g.id}`}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); setSelectedGrinder(g); }} data-testid={`button-scorecard-${g.id}`}>
                            Scorecard
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                        No grinders in this category
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedGrinder} onOpenChange={() => setSelectedGrinder(null)}>
        <DialogContent className="sm:max-w-[600px] border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              {selectedGrinder && categoryIcon(categorize(selectedGrinder))}
              {selectedGrinder?.name} - Scorecard
            </DialogTitle>
          </DialogHeader>
          {selectedGrinder && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(Number(selectedGrinder.totalEarnings))}</p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-lg font-bold">{selectedGrinder.completedOrders}/{selectedGrinder.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                    <p className="text-lg font-bold">{selectedGrinder.winRate ? (Number(selectedGrinder.winRate) * 100).toFixed(0) + "%" : "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-white/5">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Category", value: categorize(selectedGrinder) },
                    { label: "Tier", value: selectedGrinder.tier },
                    { label: "Capacity", value: `${selectedGrinder.activeOrders}/${selectedGrinder.capacity}` },
                    { label: "Utilization", value: selectedGrinder.utilization ? `${(Number(selectedGrinder.utilization) * 100).toFixed(0)}%` : "0%" },
                    { label: "Orders (Last 7d)", value: String(selectedGrinder.ordersAssignedL7D) },
                    { label: "Total Reviews", value: String(selectedGrinder.totalReviews) },
                    { label: "On-Time Rate", value: selectedGrinder.onTimeRate ? `${(Number(selectedGrinder.onTimeRate) * 100).toFixed(0)}%` : "N/A" },
                    { label: "Completion Rate", value: selectedGrinder.completionRate ? `${(Number(selectedGrinder.completionRate) * 100).toFixed(0)}%` : "N/A" },
                    { label: "Quality Rating", value: selectedGrinder.avgQualityRating ? `${Number(selectedGrinder.avgQualityRating).toFixed(1)}/5` : "N/A" },
                    { label: "Avg Turnaround", value: selectedGrinder.avgTurnaroundDays ? `${Number(selectedGrinder.avgTurnaroundDays).toFixed(1)} days` : "N/A" },
                    { label: "Last Order", value: (() => { const info = daysAgo(selectedGrinder.lastAssigned); return selectedGrinder.lastAssigned ? `${new Date(selectedGrinder.lastAssigned).toLocaleDateString()} (${info.label})` : "Never"; })() },
                    { label: "Reassignments", value: String(selectedGrinder.reassignmentCount) },
                    { label: "Cancel Rate", value: selectedGrinder.cancelRate ? `${(Number(selectedGrinder.cancelRate) * 100).toFixed(0)}%` : "N/A" },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between p-2 rounded bg-white/5">
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                      <span className="text-sm font-medium">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Strikes</h3>
                  <p className="text-xs text-muted-foreground mt-1">More strikes = lower AI suggestion score</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStrikeChange(selectedGrinder, -1)} disabled={selectedGrinder.strikes <= 0}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-full ${i < selectedGrinder.strikes ? "bg-red-500" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <span className="text-lg font-bold ml-2">{selectedGrinder.strikes}/3</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStrikeChange(selectedGrinder, 1)} disabled={selectedGrinder.strikes >= 3}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedGrinder.notes && (
                <div className="p-3 rounded-xl bg-white/5">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-1">Notes</h3>
                  <p className="text-sm">{selectedGrinder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
