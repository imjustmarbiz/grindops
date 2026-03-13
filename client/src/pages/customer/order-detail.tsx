import { useRoute } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  Activity,
  CalendarDays,
  Hash,
  DollarSign,
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const PANEL =
  "relative overflow-hidden rounded-[26px] border border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.08),rgba(255,255,255,0.02)),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_18px_60px_rgba(0,0,0,0.34)]";

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

function formatDateShort(d?: string) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timelineIcon(type: string) {
  if (type === "grinder_assigned" || type === "grinder_reassigned") return UserCheck;
  if (type === "checkpoint" || type?.includes("checkpoint")) return Activity;
  if (type === "order_update" || type?.includes("update")) return MessageSquare;
  if (type === "order_completed") return CheckCircle2;
  return RefreshCw;
}

function timelineLabel(type: string) {
  if (type === "grinder_assigned") return "Grinder assigned";
  if (type === "grinder_reassigned") return "Grinder reassigned";
  if (type === "order_completed") return "Order completed";
  if (type === "checkpoint" || type?.includes("checkpoint")) return "Activity update";
  if (type === "order_update" || (type?.includes("update") && type !== "grinder_reassigned")) return "Progress update";
  return type;
}

function statusClasses(status: string) {
  if (status === "Completed" || status === "Paid Out") {
    return {
      badge: "bg-purple-500/24 text-purple-200 border-purple-500/30",
      card: "border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.12),rgba(168,85,247,0.12))]",
      detail: "Completed successfully",
    };
  }
  if (status === "Active" || status === "Assigned") {
    return {
      badge: "bg-cyan-500/22 text-cyan-200 border-cyan-500/30",
      card: "border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.12),rgba(34,211,238,0.12))]",
      detail: "Currently in progress",
    };
  }
  return {
    badge: "bg-amber-500/22 text-amber-200 border-amber-500/30",
    card: "border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.12),rgba(245,158,11,0.12))]",
    detail: "Waiting on the next update",
  };
}

export default function CustomerOrderDetail() {
  const [, params] = useRoute("/customer/orders/:orderId");
  const orderId = params?.orderId;

  const { data, isLoading, error } = useQuery<{
    order: {
      id: string;
      mgtOrderNumber?: number;
      displayId?: string;
      status: string;
      customerPrice: string;
      serviceId?: string;
      orderDueDate?: string;
      completedAt?: string;
      orderBrief?: string;
    };
    timeline: Array<{
      id: string;
      type: string;
      source: string;
      grinderName?: string;
      note?: string;
      createdAt: string;
      proofUrls?: string[];
    }>;
    assignedGrinder: { name: string; discordUsername?: string } | null;
  }>({
    queryKey: ["/api/customer/orders", orderId],
    enabled: !!orderId,
  });

  if (!orderId) return null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <AnimatedPage>
        <div className={`${PANEL} p-8 text-center text-muted-foreground`}>
          Unable to load order.{" "}
          <Link href="/customer/orders" className="text-pink-400 underline">
            Back to orders
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  const { order, timeline, assignedGrinder } = data;
  const statusTone = statusClasses(order.status);
  const detailItems = [
    { label: "Service", value: order.serviceId || "Custom order", icon: Package },
    { label: "Assigned Grinder", value: assignedGrinder?.name || "Not assigned yet", icon: UserCheck },
    { label: "Due Date", value: formatDateShort(order.orderDueDate), icon: CalendarDays },
    { label: "Completed", value: order.completedAt ? formatDateShort(order.completedAt) : "Still active", icon: CheckCircle2 },
  ];

  return (
    <AnimatedPage className="space-y-4 pb-6 sm:space-y-6 sm:pb-8">
      <FadeInUp>
        <Link href="/customer/orders">
          <span className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/45 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-pink-400">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </span>
        </Link>
        <section className={`${PANEL} p-4 sm:p-6`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/35 to-transparent" />
          <div className="absolute right-0 top-0 hidden h-full w-[38%] bg-gradient-to-l from-pink-500/24 via-fuchsia-500/12 to-transparent sm:block" />
          <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)] lg:items-start">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-pink-300/80">
                Order Assignment
              </p>
              <div className="mt-4 flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/25 to-purple-500/25 sm:h-14 sm:w-14">
                  <Package className="h-6 w-6 text-pink-400 sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="break-words text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Order #{order.mgtOrderNumber ?? order.displayId ?? order.id}
                  </h1>
                  <p className="mt-1 text-sm text-white/60">
                    Track the latest assignment, notes, and milestone updates.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge className={`w-fit ${statusTone.badge}`}>{order.status}</Badge>
                <Badge className="w-fit border-black/45 bg-white/[0.04] text-white/65">
                  <Hash className="mr-1 h-3 w-3" />
                  {order.displayId || order.id}
                </Badge>
              </div>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {detailItems.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-[20px] border border-black/45 bg-pink-500/[0.05] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                      <Icon className="h-3.5 w-3.5 text-pink-300/80" />
                      {label}
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-white/80 sm:text-[15px]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-[24px] border p-4 sm:p-5 ${statusTone.card}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Current Status
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {order.status}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {statusTone.detail}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-[18px] border border-black/45 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <DollarSign className="h-3.5 w-3.5 text-pink-300/80" />
                    Total
                  </div>
                  <p className="mt-2 text-base font-semibold text-white sm:text-lg">
                    {formatCurrency(Number(order.customerPrice) || 0)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-black/45 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <Activity className="h-3.5 w-3.5 text-pink-300/80" />
                    Events
                  </div>
                  <p className="mt-2 text-base font-semibold text-white sm:text-lg">
                    {timeline.length}
                  </p>
                </div>
              </div>
              {assignedGrinder && (
                <div className="mt-5 rounded-[18px] border border-black/45 bg-black/20 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Active Assignment
                  </p>
                  <p className="mt-2 text-sm font-medium text-pink-300">
                    {assignedGrinder.name}
                  </p>
                  {assignedGrinder.discordUsername && (
                    <p className="mt-1 text-xs text-white/45">
                      @{assignedGrinder.discordUsername}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </FadeInUp>

      {order.orderBrief && (
        <FadeInUp>
          <section className={`${PANEL} p-4 sm:p-6`}>
            <div className="flex items-start justify-between gap-3 border-b border-black/45 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/42">
                  Briefing Notes
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                  Order Details
                </h2>
              </div>
                <Badge className="border-black/45 bg-pink-500/[0.08] text-pink-100/80">
                Customer Brief
              </Badge>
            </div>
            <div className="pt-4">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-6 text-muted-foreground sm:text-sm">
                {order.orderBrief}
              </pre>
            </div>
          </section>
        </FadeInUp>
      )}

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-6`}>
          <div className="flex flex-col gap-4 border-b border-black/45 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-pink-300/85">
                Assignment Feed
              </p>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                <Activity className="h-5 w-5 text-pink-300" />
                Activity Timeline
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Grinder assignments, checkpoint updates, and order status changes.
              </p>
            </div>
            <Badge className="w-fit border-black/45 bg-pink-500/[0.08] text-pink-300">
              {timeline.length} event{timeline.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="pt-5">
            {timeline.length === 0 ? (
              <div className="rounded-[22px] border border-black/45 bg-white/[0.02] py-10 text-center text-muted-foreground">
                No activity yet
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, i) => {
                  const Icon = timelineIcon(item.type);
                  return (
                    <div key={item.id} className="rounded-[22px] border border-black/45 bg-pink-500/[0.05] p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/20 sm:h-10 sm:w-10">
                            <Icon className="h-5 w-5 text-pink-400" />
                          </div>
                          {i < timeline.length - 1 && (
                            <div className="my-1 min-h-[20px] w-px flex-1 bg-pink-500/20" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white sm:text-[15px]">
                                {timelineLabel(item.type)}
                              </p>
                              {item.grinderName && (
                                <p className="mt-0.5 text-xs text-pink-400/80">
                                  by {item.grinderName}
                                </p>
                              )}
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/36 sm:text-[11px]">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                          {item.note && (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </FadeInUp>
    </AnimatedPage>
  );
}
