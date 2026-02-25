import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Brain, AlertTriangle, Crown, Users, Zap, Shield, DollarSign, ChevronDown, ChevronRight, Package } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Order, SuggestionResult } from "@shared/schema";

type FullQueueItem = {
  orderId: string;
  mgtOrderNumber: number | null;
  customerPrice: string;
  serviceId: string;
  platform: string;
  isEmergency: boolean;
  suggestions: SuggestionResult[];
};

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

function categoryIcon(cat: string) {
  if (cat === "Elite Grinder") return <Crown className="w-4 h-4 text-yellow-500" />;
  if (cat === "VC Grinder") return <Zap className="w-4 h-4 text-cyan-400" />;
  if (cat === "Event Grinder") return <Shield className="w-4 h-4 text-purple-400" />;
  return <Users className="w-4 h-4 text-muted-foreground" />;
}

function SuggestionCard({ s, i, customerPrice }: { s: SuggestionResult; i: number; customerPrice?: string }) {
  const profit = s.bidAmount && customerPrice ? parseFloat(customerPrice) - parseFloat(s.bidAmount) : null;
  const margin = profit !== null && parseFloat(customerPrice!) > 0 ? (profit / parseFloat(customerPrice!)) * 100 : null;

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors sm:hover:bg-white/[0.05] ${i === 0 ? "border-primary/20 bg-primary/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-suggestion-${s.grinderId}-rank-${i}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.05] text-muted-foreground"}`}>
          #{i + 1}
        </div>
        {categoryIcon(s.category)}
        <div>
          <p className="font-medium text-sm">{s.grinderName}</p>
          <p className="text-[10px] text-muted-foreground">{s.category} · {s.activeOrders}/{s.capacity} active</p>
        </div>
        {s.bidAmount && <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Bid: ${s.bidAmount}</Badge>}
        {profit !== null && (
          <Badge className={`border text-[10px] ${profit >= 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"}`}>
            <DollarSign className="w-3 h-3 mr-0.5" />
            ${profit.toFixed(0)} ({margin!.toFixed(0)}%)
          </Badge>
        )}
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
          {(s.scores.finalScore * 100).toFixed(0)}
        </Badge>
      </div>
    </div>
  );
}

export default function Queue() {
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: fullQueue, isLoading: fullLoading } = useQuery<FullQueueItem[]>({ queryKey: ["/api/queue/full"], refetchInterval: 30000 });
  const { data: services } = useQuery<{ id: string; name: string }[]>({ queryKey: ["/api/services"] });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const { data: suggestions, isLoading: sugLoading } = useQuery<SuggestionResult[]>({
    queryKey: ["/api/orders", selectedOrderId, "suggestions"],
    enabled: !!selectedOrderId,
  });

  const openOrders = (orders || []).filter(o => o.status === "Open");
  const selectedOrder = openOrders.find(o => o.id === selectedOrderId);
  const serviceName = (sid: string) => services?.find(s => s.id === sid)?.name || sid;

  return (
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-3" data-testid="text-queue-title">
            <Brain className="w-7 h-7 text-primary" />
            AI Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">9-factor weighted scoring · ranked grinder suggestions for every open order</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-primary border border-primary/20 font-bold">WEIGHTED</Badge>
          {fullQueue && <Badge variant="outline" className="text-muted-foreground">{fullQueue.length} open orders</Badge>}
        </div>
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            Active Queue
            <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px]">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {fullLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : fullQueue && fullQueue.length > 0 ? (
            <div className="space-y-3">
              {fullQueue.map(item => {
                const isExpanded = expandedOrder === item.orderId;
                const topGrinder = item.suggestions[0];
                return (
                  <div key={item.orderId} className={`rounded-xl border overflow-hidden transition-colors ${item.isEmergency ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-queue-${item.orderId}`}>
                    <button
                      className="w-full flex items-center justify-between p-3 sm:hover:bg-white/[0.03] transition-colors text-left"
                      onClick={() => setExpandedOrder(isExpanded ? null : item.orderId)}
                      data-testid={`button-expand-${item.orderId}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-mono font-bold text-sm">
                            {item.mgtOrderNumber ? `#${item.mgtOrderNumber}` : item.orderId}
                          </span>
                        </div>
                        {item.isEmergency && <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">EMERGENCY</Badge>}
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{serviceName(item.serviceId)}</span>
                        {item.platform && <Badge variant="outline" className="text-[10px] text-muted-foreground">{item.platform}</Badge>}
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          <DollarSign className="w-3 h-3 mr-0.5" />{item.customerPrice}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {topGrinder ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden sm:inline">Top:</span>
                            <span className="text-sm font-medium">{topGrinder.grinderName}</span>
                            <Badge className="bg-primary/15 text-primary border border-primary/20 text-xs">
                              {(topGrinder.scores.finalScore * 100).toFixed(0)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No candidates</span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{item.suggestions.length} ranked</Badge>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
                        {item.suggestions.length > 0 ? item.suggestions.map((s, i) => (
                          <SuggestionCard key={s.grinderId} s={s} i={i} customerPrice={item.customerPrice} />
                        )) : (
                          <div className="py-4 text-center text-muted-foreground text-sm">
                            <Brain className="w-5 h-5 mx-auto mb-1 opacity-30" />
                            No available grinders for this order
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <Package className="w-6 h-6 mr-2 opacity-30" />
              No open orders in the queue
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.02] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            Deep Dive — Single Order
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
            <SelectTrigger className="w-full max-w-md bg-background/50 border-white/10" data-testid="select-order-suggestion">
              <SelectValue placeholder="Choose an order for detailed factor breakdown..." />
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
      </FadeInUp>

      {selectedOrderId && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-400" />
              </div>
              Factor Breakdown — {openOrders.find(o => o.id === selectedOrderId)?.mgtOrderNumber 
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
                          const marginPct = parseFloat(selectedOrder.customerPrice as string) > 0 ? (profit / parseFloat(selectedOrder.customerPrice as string)) * 100 : 0;
                          return (
                            <Badge className={`border ${profit >= 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"}`} data-testid={`badge-profit-${s.grinderId}`}>
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              Profit: ${profit.toFixed(2)} ({marginPct.toFixed(0)}%)
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
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
