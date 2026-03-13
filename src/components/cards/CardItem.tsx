import { Calendar } from "lucide-react";
import type { Card } from "../../lib/types";

const typeColors: Record<string, string> = {
  task: "bg-text text-white",
  inbox: "bg-text-secondary text-white",
  project: "bg-text text-white",
  waiting: "bg-text-muted text-white",
  someday: "bg-border text-text",
  reference: "bg-border text-text",
};

interface CardItemProps {
  card: Card;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function CardItem({ card, selected, onSelect }: CardItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(card.id)}
      className={`flex w-full flex-col gap-1 border-b border-border-subtle px-4 py-2.5 text-left transition-colors ${
        selected
          ? "bg-bg-active"
          : "hover:bg-bg-hover"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase leading-none ${
            typeColors[card.card_type] ?? "bg-border text-text"
          }`}
        >
          {card.card_type}
        </span>
        <span className="truncate text-sm font-medium text-text">
          {card.title}
        </span>
      </div>

      {(card.tags.length > 0 || card.due) && (
        <div className="flex items-center gap-1.5 pl-0.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] text-text-muted"
            >
              #{tag}
            </span>
          ))}
          {card.due && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-text-secondary">
              <Calendar size={10} strokeWidth={1.5} />
              {card.due}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
