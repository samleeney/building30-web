import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ServerEvent } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL;

export function useEventStream() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const qc = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    async function connect() {
      const token = await getAccessTokenSilently();

      await fetchEventSource(`${BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
        onmessage(ev) {
          if (!ev.data) return;

          let event: ServerEvent;
          try {
            event = JSON.parse(ev.data) as ServerEvent;
          } catch {
            return;
          }

          if (event.type === "card_upsert") {
            qc.invalidateQueries({ queryKey: ["cards"] });
            qc.invalidateQueries({ queryKey: ["card", event.id] });
            qc.invalidateQueries({ queryKey: ["views"] });
          } else if (event.type === "card_delete") {
            qc.invalidateQueries({ queryKey: ["cards"] });
            qc.invalidateQueries({ queryKey: ["views"] });
            qc.removeQueries({ queryKey: ["card", event.id] });
          }
        },
        onerror() {
          // fetchEventSource retries automatically; no action needed
        },
      });
    }

    connect();

    return () => {
      ctrl.abort();
      controllerRef.current = null;
    };
  }, [isAuthenticated, getAccessTokenSilently, qc]);
}
