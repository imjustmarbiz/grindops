import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Package, Search, ArrowRight, UserCircle, PlayCircle, Calendar, Gamepad2,
} from "lucide-react";
import { FaXbox } from "react-icons/fa6";
import { SiPlaystation, SiSteam, SiNintendoswitch } from "react-icons/si";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const ACCENT_PINK = "text-pink-400";
const ACCENT_PURPLE = "text-purple-400";
const GRADIENT = "bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent";
const BORDER = "border-pink-500/20 border-purple-500/20";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    Open: { label: "Open", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "Bidding": { label: "Bidding", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    Assigned: { label: "Assigned", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    Active: { label: "Active", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    Completed: { label: "Completed", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    "Paid Out": { label: "Paid Out", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    Cancelled: { label: "Cancelled", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const s = map[status] || { label: status, className: "bg-white/10 text-white/70 border-white/20" };
  return <Badge className={`text-[11px] sm:text-xs px-2.5 py-0.5 shrink-0 ${s.className}`}>{s.label}</Badge>;
}

function ConsoleIcon({ platform, className }: { platform: string | null; className?: string }) {
  if (!platform) return <Gamepad2 className={className} />;
  const p = platform.toLowerCase();
  if (p.includes("xbox") || p.includes("xb")) return <FaXbox className={className} />;
  if (p.includes("ps") || p.includes("playstation")) return <SiPlaystation className={className} />;
  if (p.includes("pc") || p.includes("steam") || p.includes("epic")) return <SiSteam className={className} />;
  if (p.includes("switch") || p.includes("nintendo")) return <SiNintendoswitch className={className} />;
  return <Gamepad2 className={className} />;
}

type OrderItem = {
  id: string;
  mgtOrderNumber?: number | null;
  displayId?: string | null;
  status: string;
  customerPrice: string;
  serviceId?: string | null;
  serviceName?: string | null;
  orderDueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  assignedGrinderName?: string | null;
  platform?: string | null;
  hasActiveAssignment: boolean;
};

export default function CustomerOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useQuery<{ orders: OrderItem[] }>({
    queryKey: ["/api/customer/orders"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  const orders = data?.orders ?? [];
  const filtered = searchQuery.trim()
    ? orders.filter((o) =>
        String(o.mgtOrderNumber || o.displayId || o.id).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  return (
    <AnimatedPage className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border ${BORDER} p-4 sm:p-6 ${GRADIENT}`}>
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  My Orders
                </h1>
                <p className="text-sm text-white/60 mt-0.5">
                  Orders linked to your Discord account
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden relative ${GRADIENT} border ${BORDER} shadow-xl shadow-pink-500/5`}>
          <div className="absolute top-0 right-0 w-48 h-48 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 [mask-image:linear-gradient(to_bottom,transparent,black_70%)]" />
          <CardHeader className="relative pb-2 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30 shadow-inner">
                <Package className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Order List
                </CardTitle>
                <p className="text-sm text-pink-400/90 mt-0.5">
                  {filtered.length} order{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Click an order to see activity updates, grinder assignments, and completion status.
            </p>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number..."
                className="pl-9 h-11 min-h-[44px] bg-white/[0.04] border-white/10 rounded-xl focus-visible:ring-pink-500/30 text-base"
              />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-2 pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Package className="w-7 h-7 text-muted-foreground/60" />
                </div>
                <p className="text-muted-foreground font-medium">No orders found</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Orders linked to your account will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((o) => (
                  <Link key={o.id} href={`/customer/orders/${o.id}`} className="block min-h-[44px] active:scale-[0.99] transition-transform">
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-pink-500/20 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                          <Package className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-sm sm:text-base">
                            Order #{o.mgtOrderNumber ?? o.displayId ?? o.id}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {o.serviceName && <span className="truncate">{o.serviceName}</span>}
                            <span className="font-medium text-pink-400/90">{formatCurrency(Number(o.customerPrice) || 0)}</span>
                            {o.assignedGrinderName && (
                              <span className="flex items-center gap-1 shrink-0">
                                <UserCircle className="w-3 h-3 shrink-0" />
                                <span className="truncate">{o.assignedGrinderName}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] sm:text-xs text-muted-foreground/90">
                            {o.startDate && (
                              <span className="flex items-center gap-1 shrink-0">
                                <PlayCircle className="w-3 h-3 shrink-0" />
                                {new Date(o.startDate).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" })}
                              </span>
                            )}
                            {o.orderDueDate && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3 shrink-0" />
                                Due {new Date(o.orderDueDate).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t border-white/[0.04] pt-3 sm:pt-0 sm:border-t-0">
                        <div
                          className="shrink-0 p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground flex items-center justify-center"
                          title={o.platform ? `${o.platform} order` : "Platform"}
                        >
                          <ConsoleIcon platform={o.platform ?? null} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        {statusBadge(o.status)}
                        <ArrowRight className="w-5 h-5 text-pink-400/60 group-hover:text-pink-400 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
