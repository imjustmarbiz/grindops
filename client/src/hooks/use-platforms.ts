import { useQuery } from "@tanstack/react-query";

export function usePlatforms() {
  const { data: platforms = ["Xbox", "PS5"] } = useQuery<string[]>({
    queryKey: ["/api/platforms"],
    staleTime: 60000,
  });
  return platforms;
}
