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
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-queue-title">
          <Brain className="w-8 h-8 text-primary" />
          AI Assignment Suggestions
          <Badge variant="secondary" className="bg-primary/20 text-primary font-bold border-primary/30">WEIGHTED</Badge>
        </h1>
        <p className="text-muted-foreground mt-1">9-factor weighted scoring system for optimal grinder assignment</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Select an Open Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
            <SelectTrigger className="w-full max-w-md bg-background/50" data-testid="select-order-suggestion">
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
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Ranked Suggestions for {openOrders.find(o => o.id === selectedOrderId)?.mgtOrderNumber 
                ? `Order #${openOrders.find(o => o.id === selectedOrderId)?.mgtOrderNumber}` 
                : selectedOrderId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sugLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((s, i) => (
                  <div key={s.grinderId} className={`p-4 rounded-xl border ${i === 0 ? "border-primary/40 bg-primary/5" : "border-border/50 bg-white/[0.02]"}`} data-testid={`card-suggestion-${s.grinderId}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-muted-foreground"}`}>
                          #{i + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {categoryIcon(s.category)}
                          <span className="font-medium">{s.grinderName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{s.category}</Badge>
                        {s.bidAmount && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bid: ${s.bidAmount}</Badge>}
                        {s.bidAmount && selectedOrder && (() => {
                          const profit = parseFloat(selectedOrder.customerPrice as string) - parseFloat(s.bidAmount!);
                          const margin = parseFloat(selectedOrder.customerPrice as string) > 0 ? (profit / parseFloat(selectedOrder.customerPrice as string)) * 100 : 0;
                          return (
                            <Badge className={`${profit >= 0 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`} data-testid={`badge-profit-${s.grinderId}`}>
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              Profit: ${profit.toFixed(2)} ({margin.toFixed(0)}%)
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{(s.scores.finalScore * 100).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Final Score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="font-bold">{s.activeOrders}/{s.capacity}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Strikes</p>
                        <p className={`font-bold ${s.strikes > 0 ? "text-red-400" : "text-emerald-400"}`}>{s.strikes}/3</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Tier</p>
                        <p className="font-bold">{s.tier}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Base Score</p>
                        <p className="font-bold">{(s.scores.total * 100).toFixed(0)}</p>
                      </div>
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
                <p>No available grinders for this order</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Emergency / Replacement Queue
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">AUTO-BUILT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : emergency && emergency.length > 0 ? (
            <div className="space-y-3">
              {emergency.map((s, i) => (
                <div key={`${s.grinderId}-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid={`card-emergency-${i}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">#{i + 1}</span>
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
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Score: {(s.scores.finalScore * 100).toFixed(0)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <Activity className="w-5 h-5 mr-2" />
              No open orders requiring emergency assignment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
