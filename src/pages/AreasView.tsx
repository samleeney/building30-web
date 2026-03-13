import { useSearchParams } from "react-router-dom";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAreas } from "../lib/hooks/use-views";
import { useEventStream } from "../lib/hooks/use-event-stream";
import { CardList } from "../components/cards/CardList";
import { CardDetail } from "../components/cards/CardDetail";

export function AreasView() {
  useEventStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("card") ?? undefined;

  const { data, isLoading, error } = useAreas();
  const areas = data ?? {};
  const areaNames = Object.keys(areas).sort();

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
            Areas
          </h1>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Failed to load areas</span>
          </div>
        ) : areaNames.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-muted">
            <Layers size={24} strokeWidth={1} />
            <span className="font-mono text-xs">No areas</span>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto">
            {areaNames.map((area) => (
              <AreaGroup
                key={area}
                name={area}
                cards={areas[area]}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ))}
          </div>
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

function AreaGroup({
  name,
  cards,
  selectedId,
  onSelect,
}: {
  name: string;
  cards: import("../lib/types").Card[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 transition-colors hover:bg-bg-hover"
      >
        {expanded ? (
          <ChevronDown size={12} strokeWidth={1.5} className="text-text-muted" />
        ) : (
          <ChevronRight size={12} strokeWidth={1.5} className="text-text-muted" />
        )}
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {name}
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          ({cards.length})
        </span>
      </button>
      {expanded && (
        <CardList
          cards={cards}
          selectedId={selectedId}
          onSelect={onSelect}
          emptyMessage={`No cards in ${name}`}
        />
      )}
    </div>
  );
}
