import { useSearchParams } from "react-router-dom";
import { useNext } from "../lib/hooks/use-views";
import { useEventStream } from "../lib/hooks/use-event-stream";
import { CardList } from "../components/cards/CardList";
import { CardDetail } from "../components/cards/CardDetail";

export function NextView() {
  useEventStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("card") ?? undefined;

  const { data, isLoading, error } = useNext();
  const cards = data?.data ?? [];

  function handleSelect(id: string) {
    setSearchParams(id === selectedId ? {} : { card: id });
  }

  function handleClose() {
    setSearchParams({});
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
            Next Actions
          </h1>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Failed to load cards</span>
          </div>
        ) : (
          <CardList
            cards={cards}
            selectedId={selectedId}
            onSelect={handleSelect}
            emptyMessage="No next actions"
          />
        )}
      </div>
      {selectedId && (
        <div className="w-80 shrink-0 border-l border-border overflow-y-auto">
          <CardDetail cardId={selectedId} onClose={handleClose} />
        </div>
      )}
    </div>
  );
}
