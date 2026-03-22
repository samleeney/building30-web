import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { Settings, UpdateSettingsRequest } from "../types";

export function useSettings() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Settings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateSettingsRequest) =>
      api.put<Settings>("/api/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
