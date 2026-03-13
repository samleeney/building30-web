import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, TagStat, PaginatedResponse } from "../types";

export function useToday() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "today"],
    queryFn: () => api.get<PaginatedResponse<Card>>("/api/views/today"),
  });
}

export function useNext() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "next"],
    queryFn: () => api.get<PaginatedResponse<Card>>("/api/views/next"),
  });
}

export function useAreas() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "areas"],
    queryFn: () => api.get<Record<string, Card[]>>("/api/views/areas"),
  });
}

export function useTags() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<TagStat[]>("/api/tags"),
  });
}
