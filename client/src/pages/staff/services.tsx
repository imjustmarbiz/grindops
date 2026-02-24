import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import spLogo from "@assets/image_1771930905137.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, BarChart3, Gamepad2, Monitor, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Order, Service, Assignment } from "@shared/schema";

function normalizePlatform(platform: string | null | undefined): string {
  if (!platform) return "Unknown";
  const lower = platform.toLowerCase().trim();
  if (lower.includes("ps") || lower.includes("playstation")) return "PlayStation";
  if (lower.includes("xbox")) return "Xbox";
  if (lower.includes("pc")) return "PC";
  if (lower.includes("switch") || lower.includes("nintendo")) return "Nintendo";
  return platform;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtitle }: { label: string; value: string | number; icon: any; color: string; subtitle?: string }) {
  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceCard({ service, orders, assignments }: { service: Service; orders: Order[]; assignments: Assignment[] }) {
  const serviceOrders = orders.filter(o => o.serviceId === service.id);
  const total = serviceOrders.length;
  const completed = serviceOrders.filter(o => o.status === "Completed" || o.status === "Paid Out").length;
  const inProgress = serviceOrders.filter(o => o.status === "In Progress").length;
  const open = serviceOrders.filter(o => o.status === "Open").length;
  const needsReplacement = serviceOrders.filter(o => o.status === "Need Replacement").length;
  const revenue = serviceOrders.reduce((s, o) => s + parseFloat(o.customerPrice || "0"), 0);
  const avgPrice = total > 0 ? revenue / total : 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  const serviceAssignments = assignments.filter(a => {
    const order = orders.find(o => o.id === a.orderId);
    return order?.serviceId === service.id;
  });
  const completedAssignments = serviceAssignments.filter(a => a.status === "Completed");
  const avgCompletionDays = completedAssignments.length > 0
    ? completedAssignments.reduce((sum, a) => {
        const start = new Date(a.assignedDateTime).getTime();
        const end = a.deliveredDateTime ? new Date(a.deliveredDateTime).getTime() : Date.now();
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0) / completedAssignments.length
    : 0;

  const platforms = serviceOrders.reduce<Record<string, number>>((acc, o) => {
    const p = normalizePlatform(o.platform);
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="bg-card/50 border-border/30 hover:border-border/60 transition-all duration-300" data-testid={`card-service-${service.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{service.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{service.group}</Badge>
            {total > 0 && (
              <Badge variant={completionRate >= 70 ? "default" : completionRate >= 40 ? "secondary" : "destructive"} className="text-[10px]">
                {completionRate.toFixed(0)}% done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">{completed}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{inProgress}</p>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-400">{open}</p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionRate.toFixed(0)}%</span>
          </div>
          <ProgressBar value={completed} max={total || 1} color="bg-green-500" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <p className="text-muted-foreground">Revenue</p>
              <p className="font-medium">{formatCurrency(revenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <p className="text-muted-foreground">Avg Price</p>
              <p className="font-medium">{formatCurrency(avgPrice)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <p className="text-muted-foreground">Avg Days</p>
              <p className="font-medium">{avgCompletionDays > 0 ? `${avgCompletionDays.toFixed(1)}d` : "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <div>
              <p className="text-muted-foreground">Replacements</p>
              <p className="font-medium">{needsReplacement}</p>
            </div>
          </div>
        </div>

        {Object.keys(platforms).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Platform Breakdown</p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(platforms).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
                <Badge key={platform} variant="outline" className="text-[10px] gap-1">
                  {platform === "PlayStation" && <Gamepad2 className="w-3 h-3 text-blue-400" />}
                  {platform === "Xbox" && <Monitor className="w-3 h-3 text-green-400" />}
                  {platform} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>SLA: {service.slaDays}d</span>
          <span className="text-border">|</span>
          <span>Complexity: {service.defaultComplexity}/5</span>
          {service.notes && (
            <>
              <span className="text-border">|</span>
              <span className="truncate">{service.notes}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffServices() {
  const {
    services: allServices,
    orders: allOrders,
    assignments: allAssignments,
  } = useStaffData();

  if (allServices.length === 0) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AnimatedPage>
    );
  }

  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((s, o) => s + parseFloat(o.customerPrice || "0"), 0);
  const completedOrders = allOrders.filter(o => o.status === "Completed" || o.status === "Paid Out").length;
  const overallCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  const platformCounts = allOrders.reduce<Record<string, { total: number; completed: number; revenue: number; inProgress: number }>>((acc, o) => {
    const p = normalizePlatform(o.platform);
    if (!acc[p]) acc[p] = { total: 0, completed: 0, revenue: 0, inProgress: 0 };
    acc[p].total += 1;
    acc[p].revenue += parseFloat(o.customerPrice || "0");
    if (o.status === "Completed" || o.status === "Paid Out") acc[p].completed += 1;
    if (o.status === "In Progress") acc[p].inProgress += 1;
    return acc;
  }, {});

  const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1].total - a[1].total);
  const topPlatform = sortedPlatforms[0];

  const sortedServices = [...allServices].sort((a, b) => {
    const aOrders = allOrders.filter(o => o.serviceId === a.id).length;
    const bOrders = allOrders.filter(o => o.serviceId === b.id).length;
    return bOrders - aOrders;
  });

  const topService = sortedServices[0];
  const topServiceOrders = allOrders.filter(o => o.serviceId === topService?.id).length;

  return (
    <AnimatedPage>
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <FadeInUp delay={0}>
          <div className="flex items-center gap-3 mb-2">
            <img src={spLogo} alt="SP" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Services Overview</h1>
              <p className="text-sm text-muted-foreground">Performance analytics by service type and platform</p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Services" value={allServices.length} icon={Package} color="bg-primary/20 text-primary" />
            <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="bg-emerald-500/20 text-emerald-400" />
            <StatCard label="Completion Rate" value={`${overallCompletionRate.toFixed(0)}%`} icon={CheckCircle} color="bg-green-500/20 text-green-400" subtitle={`${completedOrders} of ${totalOrders} orders`} />
            <StatCard label="Top Service" value={topService?.name?.replace(/\s*[^\w\s]+$/g, '').trim() || "N/A"} icon={TrendingUp} color="bg-blue-500/20 text-blue-400" subtitle={topServiceOrders > 0 ? `${topServiceOrders} orders` : undefined} />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                Console / Platform Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPlatforms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No platform data available</p>
              ) : (
                <div className="space-y-4">
                  <div className={`grid gap-3 ${sortedPlatforms.length === 1 ? "grid-cols-1 max-w-sm" : sortedPlatforms.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {sortedPlatforms.map(([platform, stats]) => {
                      const pctOfTotal = totalOrders > 0 ? (stats.total / totalOrders) * 100 : 0;
                      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                      const isTop = topPlatform && platform === topPlatform[0];
                      return (
                        <div
                          key={platform}
                          className={`rounded-xl p-4 border transition-all ${
                            isTop ? "border-primary/30 bg-primary/5" : "border-border/30 bg-white/[0.02]"
                          }`}
                          data-testid={`card-platform-${platform.toLowerCase()}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {platform === "PlayStation" ? (
                                <Gamepad2 className="w-5 h-5 text-blue-400" />
                              ) : platform === "Xbox" ? (
                                <Monitor className="w-5 h-5 text-green-400" />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                              <span className="font-semibold text-sm">{platform}</span>
                            </div>
                            {isTop && (
                              <Badge variant="default" className="text-[10px]">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />Top
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Orders</p>
                              <p className="font-bold text-base">{stats.total}</p>
                              <p className="text-[10px] text-muted-foreground">{pctOfTotal.toFixed(0)}% of total</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Revenue</p>
                              <p className="font-bold text-base">{formatCurrency(stats.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Completed</p>
                              <p className="font-medium">{stats.completed}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">In Progress</p>
                              <p className="font-medium">{stats.inProgress}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Completion</span>
                              <span>{completionRate.toFixed(0)}%</span>
                            </div>
                            <ProgressBar value={stats.completed} max={stats.total || 1} color={
                              platform === "PlayStation" ? "bg-blue-500" : platform === "Xbox" ? "bg-green-500" : "bg-primary"
                            } />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sortedPlatforms.length >= 2 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Share of Orders</p>
                      <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex">
                        {sortedPlatforms.map(([platform, stats]) => {
                          const pct = totalOrders > 0 ? (stats.total / totalOrders) * 100 : 0;
                          const bgColor = platform === "PlayStation" ? "bg-blue-500" : platform === "Xbox" ? "bg-green-500" : platform === "PC" ? "bg-purple-500" : "bg-muted-foreground";
                          return (
                            <TooltipProvider key={platform}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`h-full ${bgColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{platform}: {stats.total} orders ({pct.toFixed(0)}%)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {sortedPlatforms.map(([platform, stats]) => {
                          const bgColor = platform === "PlayStation" ? "bg-blue-500" : platform === "Xbox" ? "bg-green-500" : platform === "PC" ? "bg-purple-500" : "bg-muted-foreground";
                          return (
                            <div key={platform} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <div className={`w-2 h-2 rounded-full ${bgColor}`} />
                              {platform} ({stats.total})
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Service Performance</h2>
            <Badge variant="secondary" className="text-[10px]">{allServices.length} services</Badge>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedServices.map((service, i) => (
            <FadeInUp key={service.id} delay={0.2 + i * 0.03}>
              <ServiceCard service={service} orders={allOrders} assignments={allAssignments} />
            </FadeInUp>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
}
