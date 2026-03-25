import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { MessageResponse } from "../types";

export interface PendingEmail {
  id: string;
  title: string;
  card_type: string;
  tags: string[];
  summary: string | null;
  body: string | null;
  from: string | null;
  subject: string | null;
  received_date: string | null;
  message_id: string | null;
  account: string | null;
  path: string;
  created_at: string;
  modified_at: string;
}

export interface PendingEmailsResponse {
  data: PendingEmail[];
}

export function useEmails() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["emails"],
    queryFn: () => api.get<PendingEmailsResponse>("/api/emails"),
  });
}

export function useInboxEmail() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) =>
      api.post<MessageResponse>(`/api/emails/${emailId}/inbox`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useArchiveEmail() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) =>
      api.post<MessageResponse>(`/api/emails/${emailId}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emails"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
