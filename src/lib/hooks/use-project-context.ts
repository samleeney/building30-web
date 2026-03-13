import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { ProjectContext } from "../types";

export function useProjectContext(projectId: string | undefined) {
  const api = useApiClient();

  return useQuery({
    queryKey: ["project-context", projectId],
    queryFn: () =>
      api.get<ProjectContext>(`/api/projects/${projectId}/context`),
    enabled: !!projectId,
  });
}
