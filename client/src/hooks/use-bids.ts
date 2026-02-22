import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Bid, InsertBid } from "@shared/schema";

export function useBids() {
  return useQuery<Bid[]>({
    queryKey: ["/api/bids"],
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidData: InsertBid) => {
      const res = await apiRequest("POST", "/api/bids", bidData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
  });
}
