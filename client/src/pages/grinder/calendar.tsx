import { useMemo } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { ActivityCalendar, type CalendarActivity, type ActivityTypeConfig } from "@/components/activity-calendar";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Loader2, FileCheck, Gavel, DollarSign, ClipboardCheck, Package, AlertTriangle, CalendarDays } from "lucide-react";

export default function GrinderCalendar() {
  const { isLoading, isElite, assignments, bids, payoutRequests, strikeLogs, alerts, eliteAccent } = useGrinderData();

  const typeConfig: Record<string, ActivityTypeConfig> = useMemo(() => ({
    assignment: {
      label: "Assignment",
      color: isElite ? "bg-cyan-500/20 text-cyan-300" : "bg-[#5865F2]/20 text-[#5865F2]",
      dotColor: isElite ? "bg-cyan-400" : "bg-[#5865F2]",
    },
    completed: {
      label: "Completed",
      color: "bg-emerald-500/20 text-emerald-300",
      dotColor: "bg-emerald-400",
    },
    bid: {
      label: "Bid",
      color: "bg-amber-500/20 text-amber-300",
      dotColor: "bg-amber-400",
    },
    payout: {
      label: "Payout",
      color: "bg-green-500/20 text-green-300",
      dotColor: "bg-green-400",
    },
    strike: {
      label: "Strike",
      color: "bg-red-500/20 text-red-300",
      dotColor: "bg-red-400",
    },
    alert: {
      label: "Alert",
      color: "bg-orange-500/20 text-orange-300",
      dotColor: "bg-orange-400",
    },
  }), [isElite]);

  const iconMap: Record<string, any> = {
    assignment: FileCheck,
    completed: Package,
    bid: Gavel,
    payout: DollarSign,
    strike: AlertTriangle,
    alert: ClipboardCheck,
  };

  const activities = useMemo(() => {
    const items: CalendarActivity[] = [];

    assignments.forEach((a: any) => {
      if (a.assignedDateTime) {
        items.push({
          id: `asgn-${a.id}`,
          type: "assignment",
          title: `Assigned: Order #${a.orderId?.slice(0, 8) || "—"}`,
          description: `${a.serviceName || "Service"} — ${a.status || "active"}`,
          date: new Date(a.assignedDateTime),
          icon: iconMap.assignment,
        });
      }
      if (a.deliveredDateTime) {
        items.push({
          id: `comp-${a.id}`,
          type: "completed",
          title: `Completed: Order #${a.orderId?.slice(0, 8) || "—"}`,
          description: `Delivered ${a.serviceName || "order"}`,
          date: new Date(a.deliveredDateTime),
          icon: iconMap.completed,
        });
      }
    });

    bids.forEach((b: any) => {
      if (b.bidTime) {
        items.push({
          id: `bid-${b.id}`,
          type: "bid",
          title: `Bid $${b.bidAmount || "—"}`,
          description: `On order ${b.orderId?.slice(0, 8)} — ${b.status || "pending"}`,
          date: new Date(b.bidTime),
          icon: iconMap.bid,
        });
      }
    });

    payoutRequests.forEach((p: any) => {
      const d = p.paidAt || p.reviewedAt || p.createdAt;
      if (d) {
        items.push({
          id: `pay-${p.id}`,
          type: "payout",
          title: `Payout $${p.amount || "—"}`,
          description: `${p.status || "pending"} — ${p.payoutPlatform || ""}`,
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
          title: `Strike ${s.action === "add" ? "Received" : "Removed"}`,
          description: s.reason || "No reason provided",
          date: new Date(s.createdAt),
          icon: iconMap.strike,
        });
      }
    });

    alerts.forEach((a: any) => {
      if (a.createdAt) {
        items.push({
          id: `alert-${a.id}`,
          type: "alert",
          title: a.title || "Staff Alert",
          description: a.message || a.body || "",
          date: new Date(a.createdAt),
          icon: iconMap.alert,
        });
      }
    });

    return items;
  }, [assignments, bids, payoutRequests, strikeLogs, alerts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className={`w-6 h-6 animate-spin ${eliteAccent}`} />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <FadeInUp>
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground`} data-testid="text-grinder-calendar-title">
                My Activity Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your assignments, bids, payouts, and activity by date
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <ActivityCalendar
            activities={activities}
            typeConfig={typeConfig}
            title="My Activity Calendar"
            accentColor={isElite ? "cyan" : "purple"}
          />
        </FadeInUp>
      </div>
    </AnimatedPage>
  );
}
