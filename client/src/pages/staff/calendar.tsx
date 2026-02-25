import { useMemo } from "react";
import { useStaffData } from "@/hooks/use-staff-data";
import { ActivityCalendar, type CalendarActivity, type ActivityTypeConfig } from "@/components/activity-calendar";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { formatLabel } from "@/lib/staff-utils";
import { Loader2, Package, Gavel, FileCheck, DollarSign, AlertTriangle, FileBarChart, ScrollText, CalendarDays } from "lucide-react";

const staffTypeConfig: Record<string, ActivityTypeConfig> = {
  order_created: { label: "Order Created", color: "bg-blue-500/20 text-blue-300", dotColor: "bg-blue-400" },
  order_completed: { label: "Order Completed", color: "bg-emerald-500/20 text-emerald-300", dotColor: "bg-emerald-400" },
  bid_placed: { label: "Bid Placed", color: "bg-amber-500/20 text-amber-300", dotColor: "bg-amber-400" },
  assignment: { label: "Assignment", color: "bg-purple-500/20 text-purple-300", dotColor: "bg-purple-400" },
  payout: { label: "Payout", color: "bg-green-500/20 text-green-300", dotColor: "bg-green-400" },
  strike: { label: "Strike", color: "bg-red-500/20 text-red-300", dotColor: "bg-red-400" },
  audit: { label: "Audit Log", color: "bg-slate-500/20 text-slate-300", dotColor: "bg-slate-400" },
};

const iconMap: Record<string, any> = {
  order_created: Package,
  order_completed: Package,
  bid_placed: Gavel,
  assignment: FileCheck,
  payout: DollarSign,
  strike: AlertTriangle,
  audit: ScrollText,
};

export default function StaffCalendar() {
  const { orders, bids, assignments, payoutReqs, strikeLogs, auditLogs, ordersUpdatedAt } = useStaffData();

  const activities = useMemo(() => {
    const items: CalendarActivity[] = [];

    orders.forEach((o: any) => {
      if (o.createdAt) {
        items.push({
          id: `oc-${o.id}`,
          type: "order_created",
          title: `Order #${o.mgtOrderNumber || o.id.slice(0, 8)}`,
          description: `${o.serviceName || "Service"} — ${o.status}`,
          date: new Date(o.createdAt),
          icon: iconMap.order_created,
        });
      }
      if (o.completedAt) {
        items.push({
          id: `od-${o.id}`,
          type: "order_completed",
          title: `Completed: #${o.mgtOrderNumber || o.id.slice(0, 8)}`,
          description: `Completed order for ${o.serviceName || "service"}`,
          date: new Date(o.completedAt),
          icon: iconMap.order_completed,
        });
      }
    });

    bids.forEach((b: any) => {
      if (b.bidTime) {
        items.push({
          id: `bid-${b.id}`,
          type: "bid_placed",
          title: `Bid $${b.bidAmount || "—"}`,
          description: `${b.grinderName || b.grinderId} bid on order ${b.orderId?.slice(0, 8)}`,
          date: new Date(b.bidTime),
          icon: iconMap.bid_placed,
        });
      }
    });

    assignments.forEach((a: any) => {
      if (a.assignedDateTime) {
        items.push({
          id: `asgn-${a.id}`,
          type: "assignment",
          title: `Assignment: ${a.grinderName || a.grinderId}`,
          description: `Assigned to order ${a.orderId?.slice(0, 8)} — ${a.status || "active"}`,
          date: new Date(a.assignedDateTime),
          icon: iconMap.assignment,
        });
      }
    });

    payoutReqs.forEach((p: any) => {
      const d = p.paidAt || p.reviewedAt || p.createdAt;
      if (d) {
        items.push({
          id: `pay-${p.id}`,
          type: "payout",
          title: `Payout $${p.amount || "—"}`,
          description: `${p.grinderName || p.grinderId} — ${p.status || "pending"}`,
          date: new Date(d),
          icon: iconMap.payout,
        });
      }
    });

    strikeLogs.forEach((s: any) => {
      if (s.createdAt) {
        items.push({
          id: `str-${s.id}`,
          type: "strike",
          title: `Strike: ${s.action === "add" ? "Issued" : "Removed"}`,
          description: `${s.grinderName || s.grinderId} — ${s.reason || "No reason"}`,
          date: new Date(s.createdAt),
          icon: iconMap.strike,
        });
      }
    });

    auditLogs.forEach((a: any) => {
      if (a.createdAt) {
        items.push({
          id: `aud-${a.id}`,
          type: "audit",
          title: `${formatLabel(a.action || "Action")}`,
          description: `${formatLabel(a.entityType || "")} by ${a.actor || "system"}`,
          date: new Date(a.createdAt),
          icon: iconMap.audit,
        });
      }
    });

    return items;
  }, [orders, bids, assignments, payoutReqs, strikeLogs, auditLogs]);

  if (!ordersUpdatedAt) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <FadeInUp>
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-staff-calendar-title">
                Activity Calendar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track all operations, orders, bids, assignments, and more by date
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <ActivityCalendar
            activities={activities}
            typeConfig={staffTypeConfig}
            title="Staff Activity Calendar"
            accentColor="purple"
          />
        </FadeInUp>
      </div>
    </AnimatedPage>
  );
}
