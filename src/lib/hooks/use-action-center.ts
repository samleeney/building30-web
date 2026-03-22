import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Card, DataResponse, MessageResponse } from "../types";

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

export function useLlmDraftQueue() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["action-queue", "draft-ready"],
    queryFn: () =>
      api.get<DataResponse<Card[]>>("/api/action-queue?filter=draft_ready"),
  });
}

export function useLlmInProgress() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["llm-in-progress"],
    queryFn: () =>
      api.get<DataResponse<Card[]>>("/api/llm/queue"),
    refetchInterval: 10000,
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
      qc.invalidateQueries({ queryKey: ["llm-in-progress"] });
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

export function useApproveDraft() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.post<MessageResponse>("/api/llm/approve", { id: cardId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-queue"] });
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
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
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
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["views"] });
      qc.invalidateQueries({ queryKey: ["llm-in-progress"] });
    },
  });
}
