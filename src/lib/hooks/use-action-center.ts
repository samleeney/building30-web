import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, PaginatedResponse, DataResponse, MessageResponse } from "../types";

export interface TriageRequest {
  id: string;
  assigned: "human" | "llm";
  instruction?: string;
  tags?: string[];
  project_id?: string;
}

export function useActionQueue() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["action-queue"],
    queryFn: () => api.get<DataResponse<Card[]>>("/api/action-queue"),
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
      api.post<MessageResponse>("/api/archive", { id: cardId }),
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
        "/api/llm/queue",
      ),
  });
}

export function useApproveDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>("/api/llm/approve", { id: cardId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}

export function useRejectDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>("/api/llm/reject", { id: cardId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
      qc.invalidateQueries({ queryKey: ["action-queue"] });
    },
  });
}

export interface ReviseRequest {
  id: string;
  feedback: string;
}

export function useReviseDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: ReviseRequest) =>
      api.post<MessageResponse>("/api/llm/revise", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
    },
  });
}
