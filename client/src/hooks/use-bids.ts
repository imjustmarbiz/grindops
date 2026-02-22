import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { InsertBid } from "@shared/schema";

export function useBids() {
  return useQuery({
    queryKey: [api.bids.list.path],
    queryFn: async () => {
      const res = await fetch(api.bids.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bids");
      const data = await res.json();
      return api.bids.list.responses[200].parse(data);
    },
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidData: InsertBid) => {
      const res = await fetch(api.bids.create.path, {
        method: api.bids.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bidData),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create bid");
      }
      return api.bids.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bids.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.queue.getTop.path] });
    },
  });
}
