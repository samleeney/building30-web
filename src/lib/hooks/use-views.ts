import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, TagStat, DataResponse } from "../types";

export interface AreaGroup {
  area: string;
  cards: Card[];
}

export function useToday() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "today"],
    queryFn: () => api.get<DataResponse<Card[]>>("/api/views/today"),
  });
}

export function useNext() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "next"],
    queryFn: () => api.get<DataResponse<Card[]>>("/api/views/next"),
  });
}

export function useAreas() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["views", "areas"],
    queryFn: () => api.get<DataResponse<AreaGroup[]>>("/api/views/areas"),
  });
}

export function useTags() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<DataResponse<TagStat[]>>("/api/tags"),
  });
}
