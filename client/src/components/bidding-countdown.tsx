import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Clock, AlertTriangle, Lock } from "lucide-react";

interface TimerData {
  orderId: string;
  mgtOrderNumber: number | null;
  status: string;
  firstBidAt: string | null;
  biddingClosesAt: string | null;
  createdAt: string | null;
}

interface BiddingTimersResponse {
  activeTimers: TimerData[];
  recentlyClosed: TimerData[];
  serverTime: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getTimerColor(ms: number): string {
  if (ms <= 60_000) return "text-red-500";
  if (ms <= 120_000) return "text-red-400";
  if (ms <= 300_000) return "text-yellow-400";
  return "text-emerald-400";
}

function getTimerBg(ms: number): string {
  if (ms <= 60_000) return "bg-red-500/10 border-red-500/30";
  if (ms <= 120_000) return "bg-red-500/5 border-red-500/20";
  if (ms <= 300_000) return "bg-yellow-500/5 border-yellow-500/20";
  return "bg-emerald-500/5 border-emerald-500/20";
}

function getTimerPulse(ms: number): string {
  if (ms <= 60_000) return "animate-pulse";
  if (ms <= 120_000) return "";
  return "";
}

function SingleTimer({ timer }: { timer: TimerData }) {
  const remaining = useBiddingRemaining(timer.biddingClosesAt);

  if (!timer.biddingClosesAt) return null;

  const orderLabel = timer.mgtOrderNumber ? `#${timer.mgtOrderNumber}` : timer.orderId.substring(0, 8);

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-muted" data-testid={`timer-closed-${timer.orderId}`}>
        <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">Order {orderLabel}</span>
        </div>
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">Closed</Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${getTimerBg(remaining)} ${getTimerPulse(remaining)}`} data-testid={`timer-active-${timer.orderId}`}>
      <div className={`shrink-0 ${getTimerColor(remaining)}`}>
        {remaining <= 120_000 ? <AlertTriangle className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">Order {orderLabel}</span>
      </div>
      <div className={`font-mono text-lg font-bold tabular-nums ${getTimerColor(remaining)}`} data-testid={`timer-countdown-${timer.orderId}`}>
        {formatCountdown(remaining)}
      </div>
    </div>
  );
}

export function BiddingCountdownPanel({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { data } = useQuery<BiddingTimersResponse>({
    queryKey: ["/api/bidding-timers"],
    refetchInterval: 10_000,
  });

  const activeTimers = data?.activeTimers || [];
  const recentlyClosed = data?.recentlyClosed || [];

  if (activeTimers.length === 0 && recentlyClosed.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="space-y-2" data-testid="bidding-timers-compact">
        {activeTimers.map(timer => (
          <SingleTimer key={timer.orderId} timer={timer} />
        ))}
        {recentlyClosed.map(timer => (
          <SingleTimer key={timer.orderId} timer={timer} />
        ))}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent" data-testid="bidding-timers-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Bidding Countdowns
          {activeTimers.length > 0 && (
            <Badge className="bg-primary/20 text-primary ml-auto">{activeTimers.length} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeTimers.map(timer => (
          <SingleTimer key={timer.orderId} timer={timer} />
        ))}
        {recentlyClosed.map(timer => (
          <SingleTimer key={timer.orderId} timer={timer} />
        ))}
        {activeTimers.length === 0 && recentlyClosed.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">No active countdowns</p>
        )}
      </CardContent>
    </Card>
  );
}

export function useServerOffset() {
  const { data } = useQuery<BiddingTimersResponse>({
    queryKey: ["/api/bidding-timers"],
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  return data?.serverTime
    ? new Date(data.serverTime).getTime() - Date.now()
    : 0;
}

export function useBiddingRemaining(biddingClosesAt: string | null): number {
  const serverOffset = useServerOffset();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!biddingClosesAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [biddingClosesAt]);

  if (!biddingClosesAt) return -1;
  return new Date(biddingClosesAt).getTime() - (now + serverOffset);
}

export function InlineCountdown({ biddingClosesAt }: { biddingClosesAt: string | null }) {
  const remaining = useBiddingRemaining(biddingClosesAt);

  if (!biddingClosesAt) return null;

  if (remaining <= 0) {
    return <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-[10px]" data-testid="badge-bidding-closed"><Lock className="w-3 h-3 mr-1" />Closed</Badge>;
  }

  return (
    <Badge variant="outline" className={`text-[10px] ${remaining <= 120_000 ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" : remaining <= 300_000 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`} data-testid="badge-bidding-countdown">
      <Timer className="w-3 h-3 mr-1" />
      {formatCountdown(remaining)}
    </Badge>
  );
}
