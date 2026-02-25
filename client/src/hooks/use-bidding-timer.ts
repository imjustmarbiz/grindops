import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface BiddingTimersResponse {
  activeTimers: any[];
  recentlyClosed: any[];
  serverTime: string;
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
