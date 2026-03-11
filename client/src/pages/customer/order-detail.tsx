import { useRoute } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Package, ArrowLeft, UserCheck, RefreshCw, MessageSquare, CheckCircle2, Activity,
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const ACCENT_PINK = "text-pink-400";
const ACCENT_PURPLE = "text-purple-400";
const GRADIENT = "bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent";
const BORDER = "border-pink-500/20 border-purple-500/20";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timelineIcon(type: string) {
  if (type === "grinder_assigned" || type === "grinder_reassigned") return UserCheck;
  if (type === "checkpoint" || type?.includes("checkpoint")) return Activity;
  if (type === "order_update" || type?.includes("update")) return MessageSquare;
  if (type === "order_completed") return CheckCircle2;
  return RefreshCw;
}

export default function CustomerOrderDetail() {
  const [, params] = useRoute("/customer/orders/:orderId");
  const orderId = params?.orderId;

  const { data, isLoading, error } = useQuery<{
    order: { id: string; mgtOrderNumber?: number; displayId?: string; status: string; customerPrice: string; serviceId?: string; orderDueDate?: string; completedAt?: string; orderBrief?: string };
    timeline: Array<{ id: string; type: string; source: string; grinderName?: string; note?: string; createdAt: string; proofUrls?: string[] }>;
    assignedGrinder: { name: string; discordUsername?: string } | null;
  }>({
    queryKey: ["/api/customer/orders", orderId],
    enabled: !!orderId,
  });

  if (!orderId) return null;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <AnimatedPage>
        <Card className="border border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            Unable to load order. <Link href="/customer/orders" className="text-pink-400 underline">Back to orders</Link>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  const { order, timeline, assignedGrinder } = data;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <Link href="/customer/orders">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-400 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to orders
          </span>
        </Link>
        <div className={`relative overflow-hidden rounded-2xl border ${BORDER} p-5 sm:p-6 ${GRADIENT}`}>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  Order #{order.mgtOrderNumber ?? order.displayId ?? order.id}
                </h1>
                <p className="text-sm text-white/60 mt-0.5">{formatCurrency(Number(order.customerPrice) || 0)}</p>
                {assignedGrinder && (
                  <p className="text-xs text-pink-400/80 mt-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Assigned to {assignedGrinder.name}
                  </p>
                )}
              </div>
            </div>
            <Badge className={`w-fit ${
              order.status === "Completed" || order.status === "Paid Out" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
              order.status === "Active" || order.status === "Assigned" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
              "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>
              {order.status}
            </Badge>
          </div>
        </div>
      </FadeInUp>

      {order.orderBrief && (
        <FadeInUp>
          <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
            <CardHeader>
              <CardTitle className="text-pink-400 text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{order.orderBrief}</pre>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
          <CardHeader>
            <CardTitle className="text-pink-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Grinder assignments, checkpoint updates, and order status changes
            </p>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-0">
                {timeline.map((item, i) => {
                  const Icon = timelineIcon(item.type);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 border border-pink-500/30">
                          <Icon className="w-5 h-5 text-pink-400" />
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 min-h-[20px] bg-pink-500/20 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-white">
                          {item.type === "grinder_assigned" && "Grinder assigned"}
                          {item.type === "grinder_reassigned" && "Grinder reassigned"}
                          {item.type === "order_completed" && "Order completed"}
                          {item.type === "checkpoint" || item.type?.includes("checkpoint") ? "Activity update" : ""}
                          {item.type === "order_update" || (item.type?.includes("update") && item.type !== "grinder_reassigned") ? "Progress update" : ""}
                          {!["grinder_assigned", "grinder_reassigned", "order_completed", "checkpoint", "order_update"].some(t => item.type?.includes?.(t) || item.type === t) && item.type}
                        </p>
                        {item.grinderName && (
                          <p className="text-xs text-pink-400/80 mt-0.5">by {item.grinderName}</p>
                        )}
                        {item.note && (
                          <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-2">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
