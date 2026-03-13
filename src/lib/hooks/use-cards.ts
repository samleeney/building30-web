import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, CardDetail, PaginatedResponse, DataResponse } from "../types";

export interface UseCardsParams {
  type?: string;
  tags?: string;
  limit?: number;
  cursor?: string;
}

function buildQuery(params?: UseCardsParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
  if (params.tags) sp.set("tags", params.tags);
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function useCards(params?: UseCardsParams) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["cards", params ?? {}],
    queryFn: () => api.get<PaginatedResponse<Card>>(`/api/cards${buildQuery(params)}`),
  });
}

export function useCard(id: string | undefined) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["card", id],
    queryFn: () => api.get<DataResponse<CardDetail>>(`/api/cards/${id}`),
    enabled: !!id,
  });
}
