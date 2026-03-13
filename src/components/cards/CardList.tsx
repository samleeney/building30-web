import { Inbox } from "lucide-react";
import type { Card } from "../../lib/types";
import { CardItem } from "./CardItem";

interface CardListProps {
  cards: Card[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

export function CardList({
  cards,
  selectedId,
  onSelect,
  emptyMessage = "No cards to show",
}: CardListProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-muted">
        <Inbox size={24} strokeWidth={1} />
        <span className="font-mono text-xs">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          selected={card.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
