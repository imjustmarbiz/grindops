import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      return api.services.list.responses[200].parse(data);
    },
  });
}
