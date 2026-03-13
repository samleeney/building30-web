import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, PaginatedResponse, MessageResponse } from "../types";

export interface TriageRequest {
  card_id: string;
  assigned?: "human" | "llm";
  tags?: string[];
  project_id?: string;
}

export function useActionQueue() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["action-queue"],
    queryFn: () => api.get<Card[]>("/api/action-queue"),
  });
}

export function useTriage() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: TriageRequest) =>
      api.post<MessageResponse>("/api/triage", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useArchiveCard() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>("/api/archive", { card_id: cardId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useDrafts() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["cards", "drafts"],
    queryFn: () =>
      api.get<PaginatedResponse<Card>>(
        "/api/cards?assigned=llm&llm_status=draft_ready",
      ),
  });
}

export function useApproveDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>(`/api/cards/${cardId}/approve`),
    onSuccess: (_data, cardId) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useRejectDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>(`/api/cards/${cardId}/reject`),
    onSuccess: (_data, cardId) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useReviseDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>(`/api/cards/${cardId}/revise`),
    onSuccess: (_data, cardId) => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}
