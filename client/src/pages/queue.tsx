import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Brain, AlertTriangle, Crown, Users, Zap, Shield, DollarSign } from "lucide-react";
import type { Order, SuggestionResult } from "@shared/schema";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
      <span className="text-xs font-mono w-10 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function Queue() {
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: emergency, isLoading: emergLoading } = useQuery<SuggestionResult[]>({ queryKey: ["/api/queue/emergency"] });
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const { data: suggestions, isLoading: sugLoading } = useQuery<SuggestionResult[]>({
    queryKey: ["/api/orders", selectedOrderId, "suggestions"],
    enabled: !!selectedOrderId,
  });

  const openOrders = (orders || []).filter(o => o.status === "Open");
  const selectedOrder = openOrders.find(o => o.id === selectedOrderId);

  const categoryIcon = (cat: string) => {
    if (cat === "Elite Grinder") return <Crown className="w-4 h-4 text-yellow-500" />;
    if (cat === "VC Grinder") return <Zap className="w-4 h-4 text-cyan-400" />;
    if (cat === "Event Grinder") return <Shield className="w-4 h-4 text-purple-400" />;
    return <Users className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-3" data-testid="text-queue-title">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            AI Assignment Suggestions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">9-factor weighted scoring system for optimal grinder assignment</p>
        </div>
        <Badge className="bg-primary/15 text-primary border border-primary/20 font-bold">WEIGHTED</Badge>
      </div>

      <Card className="border-0 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.02] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            Select an Open Order
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
            <SelectTrigger className="w-full max-w-md bg-background/50 border-white/10" data-testid="select-order-suggestion">
              <SelectValue placeholder="Choose an order to get AI suggestions..." />
            </SelectTrigger>
            <SelectContent>
              {openOrders.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.mgtOrderNumber ? `Order #${o.mgtOrderNumber}` : o.id} - ${o.customerPrice}
                  {o.isEmergency && " [EMERGENCY]"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedOrderId && (
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-400" />
              </div>
              Ranked Suggestions for {openOrders.find(o => o.id === selectedOrderId)?.mgtOrderNumber 
                ? `Order #${openOrders.find(o => o.id === selectedOrderId)?.mgtOrderNumber}` 
                : selectedOrderId}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {sugLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((s, i) => (
                  <div key={s.grinderId} className={`p-4 rounded-xl border transition-all sm:hover:scale-[1.01] ${i === 0 ? "border-primary/30 bg-primary/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-suggestion-${s.grinderId}`}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.05] text-muted-foreground"}`}>
                          #{i + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {categoryIcon(s.category)}
                          <span className="font-medium">{s.grinderName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-white/[0.03]">{s.category}</Badge>
                        {s.bidAmount && <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Bid: ${s.bidAmount}</Badge>}
                        {s.bidAmount && selectedOrder && (() => {
                          const profit = parseFloat(selectedOrder.customerPrice as string) - parseFloat(s.bidAmount!);
                          const margin = parseFloat(selectedOrder.customerPrice as string) > 0 ? (profit / parseFloat(selectedOrder.customerPrice as string)) * 100 : 0;
                          return (
                            <Badge className={`border ${profit >= 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"}`} data-testid={`badge-profit-${s.grinderId}`}>
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              Profit: ${profit.toFixed(2)} ({margin.toFixed(0)}%)
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{(s.scores.finalScore * 100).toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Final Score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {[
                        { label: "Active", value: `${s.activeOrders}/${s.capacity}`, color: "text-blue-400" },
                        { label: "Strikes", value: `${s.strikes}/3`, color: s.strikes > 0 ? "text-red-400" : "text-emerald-400" },
                        { label: "Tier", value: s.category, color: "text-amber-400" },
                        { label: "Base Score", value: (s.scores.total * 100).toFixed(0), color: "text-primary" },
                      ].map(stat => (
                        <div key={stat.label} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                          <p className={`font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <ScoreBar label="Margin" value={s.scores.margin} color="bg-emerald-500" />
                      <ScoreBar label="Capacity" value={s.scores.capacity} color="bg-blue-500" />
                      <ScoreBar label="Tier" value={s.scores.tier} color="bg-yellow-500" />
                      <ScoreBar label="Fairness" value={s.scores.fairness} color="bg-purple-500" />
                      <ScoreBar label="New Grinder" value={s.scores.newGrinder} color="bg-cyan-500" />
                      <ScoreBar label="Reliability" value={s.scores.reliability} color="bg-indigo-500" />
                      <ScoreBar label="Quality" value={s.scores.quality} color="bg-pink-500" />
                      <ScoreBar label="Risk" value={s.scores.risk} color="bg-orange-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <Brain className="w-6 h-6 mr-2 opacity-30" />
                No available grinders for this order
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            Emergency / Replacement Queue
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">AUTO-BUILT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {emergLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : emergency && emergency.length > 0 ? (
            <div className="space-y-2">
              {emergency.map((s, i) => (
                <div key={`${s.grinderId}-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-colors" data-testid={`card-emergency-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold text-muted-foreground">
                      #{i + 1}
                    </div>
                    {categoryIcon(s.category)}
                    <div>
                      <p className="font-medium text-sm">{s.grinderName}</p>
                      <p className="text-xs text-muted-foreground">{s.category} &middot; {s.activeOrders}/{s.capacity} active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.strikes > 0 && (
                      <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className={`w-2 h-2 rounded-full ${j < s.strikes ? "bg-red-500" : "bg-white/10"}`} />
                        ))}
                      </div>
                    )}
                    <Badge className="bg-primary/15 text-primary border border-primary/20">
                      Score: {(s.scores.finalScore * 100).toFixed(0)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <Activity className="w-5 h-5 mr-2 opacity-30" />
              No open orders requiring emergency assignment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
