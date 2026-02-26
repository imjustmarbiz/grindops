import { useQuery } from "@tanstack/react-query";
import type { Grinder } from "@shared/schema";

export function useGrinders() {
  return useQuery<Grinder[]>({
    queryKey: ["/api/grinders"],
    refetchInterval: 30000,
  });
}
