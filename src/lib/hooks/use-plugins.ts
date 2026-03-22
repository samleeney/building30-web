import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { PluginInfo, PluginConfig, SyncReport } from "../types";

export function usePlugins() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["plugins"],
    queryFn: () => api.get<PluginInfo[]>("/api/plugins"),
  });
}

export function usePluginConfig(name: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["plugins", name],
    queryFn: () => api.get<PluginConfig>(`/api/plugins/${encodeURIComponent(name)}`),
    enabled: !!name,
  });
}

export function useUpdatePlugin(name: string) {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      api.put<PluginConfig>(`/api/plugins/${encodeURIComponent(name)}`, { config }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugins"] });
      qc.invalidateQueries({ queryKey: ["plugins", name] });
    },
  });
}

export function useSyncPlugin(name: string) {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<SyncReport>(`/api/plugins/${encodeURIComponent(name)}/sync`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugins"] });
      qc.invalidateQueries({ queryKey: ["plugins", name] });
    },
  });
}
