import { useQuery } from "@tanstack/react-query";

export function useTopQueue() {
  return useQuery({
    queryKey: ["/api/queue/top"],
    refetchInterval: 10000,
  });
}
