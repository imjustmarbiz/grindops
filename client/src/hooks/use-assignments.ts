import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { InsertAssignment } from "@shared/schema";

export function useAssignments() {
  return useQuery({
    queryKey: [api.assignments.list.path],
    queryFn: async () => {
      const res = await fetch(api.assignments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      return api.assignments.list.responses[200].parse(data);
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentData: InsertAssignment) => {
      const res = await fetch(api.assignments.create.path, {
        method: api.assignments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create assignment");
      }
      return api.assignments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assignments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.queue.getTop.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
