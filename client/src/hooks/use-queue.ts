import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTopQueue() {
  return useQuery({
    queryKey: [api.queue.getTop.path],
    queryFn: async () => {
      const res = await fetch(api.queue.getTop.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      return api.queue.getTop.responses[200].parse(data);
    },
    refetchInterval: 30000, // Refresh queue every 30 seconds
  });
}
