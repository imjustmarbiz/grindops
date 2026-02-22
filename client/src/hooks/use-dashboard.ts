import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@shared/schema";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
}
