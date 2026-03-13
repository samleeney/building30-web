import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { CardDetail, DataResponse, UpdateResponse } from "../types";

export function useCreateCard() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { type: string; title: string; tags?: string[]; body?: string; project_id?: string }) =>
      api.post<DataResponse<CardDetail>>("/api/cards", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useUpdateCard() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mods }: { id: string; mods: string[] }) =>
      api.put<UpdateResponse>(`/api/cards/${id}`, { mods }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", id] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useDeleteCard() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/cards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useMarkDone() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rationale }: { id: string; rationale?: string }) =>
      api.post<UpdateResponse>(`/api/cards/${id}/done`, rationale ? { rationale } : undefined),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", id] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useUpdateBody() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.put<DataResponse<CardDetail>>(`/api/cards/${id}/body`, { body }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["card", id] });
    },
  });
}

export function useUpdateField() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: string }) =>
      api.put<DataResponse<CardDetail>>(`/api/cards/${id}/field`, { field, value }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", id] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}
