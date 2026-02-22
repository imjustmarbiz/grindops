import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useGrinders() {
  return useQuery({
    queryKey: [api.grinders.list.path],
    queryFn: async () => {
      const res = await fetch(api.grinders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grinders");
      const data = await res.json();
      return api.grinders.list.responses[200].parse(data);
    },
  });
}

export function useGrinder(id: string) {
  return useQuery({
    queryKey: [api.grinders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.grinders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch grinder");
      const data = await res.json();
      return api.grinders.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}
