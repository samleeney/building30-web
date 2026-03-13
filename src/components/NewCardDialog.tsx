import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCreateCard } from "../lib/hooks/use-mutations";
import type { CardType } from "../lib/types";

const cardTypes: { value: CardType; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "task", label: "Task" },
  { value: "project", label: "Project" },
  { value: "waiting", label: "Waiting" },
  { value: "someday", label: "Someday" },
  { value: "reference", label: "Reference" },
];

interface NewCardDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewCardDialog({ open, onClose }: NewCardDialogProps) {
  const [type, setType] = useState<CardType>("inbox");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const createCard = useCreateCard();

  useEffect(() => {
    if (open) {
      setType("inbox");
      setTitle("");
      setTags("");
      setBody("");
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    createCard.mutate(
      {
        type,
        title: trimmed,
        tags: tagList.length > 0 ? tagList : undefined,
        body: body.trim() || undefined,
      },
      { onSuccess: () => onClose() }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-lg border border-border bg-bg p-0 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
            New Card
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          <div className="flex gap-2">
            {cardTypes.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setType(ct.value)}
                className={`px-2 py-1 font-mono text-xs transition-colors ${
                  type === ct.value
                    ? "bg-accent text-white"
                    : "bg-bg-panel text-text-muted hover:text-text"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>

          <input
            ref={titleRef}
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border bg-bg-panel px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-border bg-bg-panel px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <textarea
            placeholder="Body (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full resize-y border border-border bg-bg-panel px-3 py-2 font-mono text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createCard.isPending}
              className="bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-40 transition-opacity"
            >
              {createCard.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
