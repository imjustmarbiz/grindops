import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Assignment, InsertAssignment } from "@shared/schema";

export function useAssignments() {
  return useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentData: InsertAssignment) => {
      const res = await apiRequest("POST", "/api/assignments", assignmentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
  });
}
