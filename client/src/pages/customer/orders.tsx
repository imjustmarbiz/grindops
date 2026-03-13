import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Calendar,
  Gamepad2,
  Loader2,
  Package,
  PlayCircle,
  Search,
  UserCircle,
} from "lucide-react";
import { FaXbox } from "react-icons/fa6";
import { SiNintendoswitch, SiPlaystation, SiSteam } from "react-icons/si";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const PANEL =
  "relative overflow-hidden rounded-[28px] border border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.08),rgba(255,255,255,0.02)),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_18px_60px_rgba(0,0,0,0.34)]";

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
    <AnimatedPage className="space-y-4 pb-6 sm:space-y-6 sm:pb-8">
      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7 lg:p-8`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />
          <div className="absolute right-0 top-0 hidden h-full w-[42%] bg-gradient-to-l from-pink-500/22 via-fuchsia-500/12 to-transparent sm:block" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pink-300/90">
                Order Archive
              </p>
              <div className="mt-4 flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-400/25 bg-pink-500/12 sm:h-14 sm:w-14">
                  <Package className="h-6 w-6 text-pink-300 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-5xl">
                    My Orders
                  </h1>
                  <p className="mt-1 text-sm text-white/58">
                    A cleaner, more premium view of every order attached to your account.
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:mt-5 sm:text-[15px] sm:leading-7">
                Search by order number, open any job, and track its current service, assignment, and timeline at a glance.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              <div className="rounded-[22px] border border-black/45 bg-pink-500/[0.12] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Visible Orders</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{filtered.length}</p>
              </div>
              <div className="rounded-[22px] border border-black/45 bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Search Ready</p>
                <p className="mt-3 text-sm leading-6 text-white/66">
                  Filter instantly by order number or display id.
                </p>
              </div>
            </div>
          </div>
        </section>
      </FadeInUp>

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7`}>
          <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-pink-500/16 via-fuchsia-500/8 to-transparent md:block" />
          <div className="relative z-10 border-b border-black/45 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Order Feed
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  Order List
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Open an order to view activity updates, grinder assignments, and completion progress.
                </p>
              </div>

              <div className="self-start rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300">
                {filtered.length} order{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="relative mt-5 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number..."
                className="h-11 min-h-[44px] rounded-full border-black/45 bg-pink-500/[0.08] pl-9 text-base focus-visible:ring-pink-500/30"
              />
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-5">
            {filtered.length === 0 ? (
              <div className="rounded-[24px] border border-black/45 bg-white/[0.02] py-16 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-500/15 bg-pink-500/8">
                  <Package className="w-7 h-7 text-muted-foreground/60" />
                </div>
                <p className="font-medium text-white/74">No orders found</p>
                <p className="mt-1 text-xs text-white/42">Orders linked to your account will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((o) => (
                  <Link key={o.id} href={`/customer/orders/${o.id}`} className="block min-h-[44px] active:scale-[0.99] transition-transform">
                    <div
                      className="group flex flex-col gap-3 rounded-[24px] border border-black/45 bg-pink-500/[0.05] p-4 transition-all duration-200 hover:border-pink-500/28 hover:bg-pink-500/[0.09] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 sm:h-11 sm:w-11">
                          <Package className="w-5 h-5 text-pink-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white sm:text-base">
                            Order #{o.mgtOrderNumber ?? o.displayId ?? o.id}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {o.serviceName && <span className="truncate">{o.serviceName}</span>}
                            <span className="font-medium text-pink-300">{formatCurrency(Number(o.customerPrice) || 0)}</span>
                            {o.assignedGrinderName && (
                              <span className="flex items-center gap-1 shrink-0">
                                <UserCircle className="w-3 h-3 shrink-0" />
                                <span className="truncate">{o.assignedGrinderName}</span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/90 sm:text-xs">
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
                      <div className="flex flex-wrap items-center justify-start gap-2 border-t border-black/35 pt-3 sm:shrink-0 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div
                          className="flex shrink-0 items-center justify-center rounded-full border border-black/45 bg-pink-500/[0.08] p-2 text-pink-100/75"
                          title={o.platform ? `${o.platform} order` : "Platform"}
                        >
                          <ConsoleIcon platform={o.platform ?? null} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        {statusBadge(o.status)}
                        <ArrowRight className="w-5 h-5 shrink-0 text-pink-300/65 transition-all group-hover:translate-x-1 group-hover:text-pink-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeInUp>
    </AnimatedPage>
  );
}
