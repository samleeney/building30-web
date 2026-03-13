import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  X,
  Check,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Tag,
  Plus,
  Pencil,
  Link as LinkIcon,
} from "lucide-react";
import { useCard } from "../../lib/hooks/use-cards";
import {
  useUpdateField,
  useUpdateBody,
  useMarkDone,
  useDeleteCard,
  useUpdateCard,
} from "../../lib/hooks/use-mutations";
import type { CardDetail as CardDetailType, CardType } from "../../lib/types";

const typeColors: Record<string, string> = {
  task: "bg-text text-white",
  inbox: "bg-text-secondary text-white",
  project: "bg-text text-white",
  waiting: "bg-text-muted text-white",
  someday: "bg-border text-text",
  reference: "bg-border text-text",
};

const moveTargets: { label: string; type: CardType }[] = [
  { label: "Inbox", type: "inbox" },
  { label: "Task", type: "task" },
  { label: "Waiting", type: "waiting" },
  { label: "Someday", type: "someday" },
  { label: "Reference", type: "reference" },
];

interface CardDetailProps {
  cardId: string;
  onClose?: () => void;
}

export function CardDetail({ cardId, onClose }: CardDetailProps) {
  const { data, isLoading, error } = useCard(cardId);
  const card = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Loading...</span>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Card not found</span>
      </div>
    );
  }

  return <CardDetailInner card={card} onClose={onClose} />;
}

function CardDetailInner({
  card,
  onClose,
}: {
  card: CardDetailType;
  onClose?: () => void;
}) {
  const updateField = useUpdateField();
  const updateBody = useUpdateBody();
  const markDone = useMarkDone();
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyDraft, setBodyDraft] = useState(card.body ?? "");
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Sync drafts when card changes
  useEffect(() => {
    if (!editingTitle) setTitleDraft(card.title);
  }, [card.title, editingTitle]);

  useEffect(() => {
    if (!editingBody) setBodyDraft(card.body ?? "");
  }, [card.body, editingBody]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingBody) bodyRef.current?.focus();
  }, [editingBody]);

  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  function saveTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== card.title) {
      updateField.mutate({ id: card.id, field: "title", value: trimmed });
    }
    setEditingTitle(false);
  }

  function saveBody() {
    if (bodyDraft !== (card.body ?? "")) {
      updateBody.mutate({ id: card.id, body: bodyDraft });
    }
    setEditingBody(false);
  }

  function handleTitleKey(e: KeyboardEvent) {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") {
      setTitleDraft(card.title);
      setEditingTitle(false);
    }
  }

  function handleBodyKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setBodyDraft(card.body ?? "");
      setEditingBody(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag) {
      updateCard.mutate({ id: card.id, mods: [`+tag:${tag}`] });
      setTagInput("");
    }
    setShowTagInput(false);
  }

  function removeTag(tag: string) {
    updateCard.mutate({ id: card.id, mods: [`-tag:${tag}`] });
  }

  function handleTagKey(e: KeyboardEvent) {
    if (e.key === "Enter") addTag();
    if (e.key === "Escape") {
      setTagInput("");
      setShowTagInput(false);
    }
  }

  function handleMove(type: CardType) {
    updateCard.mutate({ id: card.id, mods: [`type:${type}`] });
    setShowMoveMenu(false);
  }

  function handleDelete() {
    if (confirmDelete) {
      deleteCard.mutate(card.id, {
        onSuccess: () => onClose?.(),
      });
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span
          className={`inline-flex shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase leading-none ${
            typeColors[card.card_type] ?? "bg-border text-text"
          }`}
        >
          {card.card_type}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Title */}
        <div>
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKey}
              className="w-full border-b border-border bg-transparent text-base font-semibold text-text outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="group flex w-full items-center gap-1.5 text-left"
            >
              <h2 className="text-base font-semibold text-text">
                {card.title}
              </h2>
              <Pencil
                size={12}
                strokeWidth={1.5}
                className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
            >
              <Tag size={9} strokeWidth={1.5} />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-text-muted transition-colors hover:text-text"
              >
                <X size={9} strokeWidth={2} />
              </button>
            </span>
          ))}
          {showTagInput ? (
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={addTag}
              onKeyDown={handleTagKey}
              placeholder="tag name"
              className="w-20 border-b border-border bg-transparent font-mono text-[10px] text-text outline-none placeholder:text-text-muted"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 px-1 py-0.5 font-mono text-[10px] text-text-muted transition-colors hover:text-text"
            >
              <Plus size={9} strokeWidth={2} />
              tag
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Body
            </span>
          </div>
          {editingBody ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={bodyRef}
                value={bodyDraft}
                onChange={(e) => setBodyDraft(e.target.value)}
                onKeyDown={handleBodyKey}
                rows={10}
                className="w-full border border-border bg-bg-panel p-2 font-mono text-xs text-text outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={saveBody}
                  className="inline-flex items-center gap-1 bg-accent px-2 py-1 font-mono text-[10px] text-white transition-opacity hover:opacity-80"
                >
                  <Check size={10} strokeWidth={2} />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBodyDraft(card.body ?? "");
                    setEditingBody(false);
                  }}
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:text-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingBody(true)}
              className="group w-full text-left"
            >
              {card.body ? (
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
                  {card.body}
                </pre>
              ) : (
                <span className="font-mono text-xs text-text-muted italic">
                  No body — click to add
                </span>
              )}
              <Pencil
                size={10}
                strokeWidth={1.5}
                className="mt-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          )}
        </div>

        {/* Metadata */}
        <Metadata card={card} />

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => markDone.mutate({ id: card.id })}
            disabled={markDone.isPending}
            className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <Check size={12} strokeWidth={2} />
            Mark Done
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoveMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[10px] font-medium text-text-secondary transition-colors hover:text-text"
            >
              <ArrowRightLeft size={12} strokeWidth={1.5} />
              Move
            </button>
            {showMoveMenu && (
              <div className="absolute bottom-full left-0 z-10 mb-1 border border-border bg-bg-panel shadow-sm">
                {moveTargets
                  .filter((t) => t.type !== card.card_type)
                  .map((target) => (
                    <button
                      key={target.type}
                      type="button"
                      onClick={() => handleMove(target.type)}
                      className="flex w-full px-3 py-1.5 text-left font-mono text-[10px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
                    >
                      {target.label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteCard.isPending}
            className={`ml-auto inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] font-medium transition-colors disabled:opacity-50 ${
              confirmDelete
                ? "border-red-400 bg-red-50 text-red-600"
                : "border-border text-text-muted hover:text-text"
            }`}
          >
            <Trash2 size={12} strokeWidth={1.5} />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metadata({ card }: { card: CardDetailType }) {
  const items: { label: string; value: string; icon: typeof Calendar }[] = [];

  if (card.due_display || card.due) {
    items.push({
      label: "Due",
      value: card.due_display ?? card.due ?? "",
      icon: Calendar,
    });
  }
  if (card.start_display || card.start) {
    items.push({
      label: "Start",
      value: card.start_display ?? card.start ?? "",
      icon: Calendar,
    });
  }
  if (card.project) {
    items.push({ label: "Project", value: card.project, icon: Calendar });
  }
  if (card.time_estimate) {
    items.push({
      label: "Estimate",
      value: card.time_estimate,
      icon: Calendar,
    });
  }
  if (card.energy) {
    items.push({ label: "Energy", value: card.energy, icon: Calendar });
  }

  if (items.length === 0 && (!card.links || card.links.length === 0))
    return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
        Details
      </span>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="contents">
            <span className="font-mono text-[10px] text-text-muted">
              {item.label}
            </span>
            <span className="font-mono text-[10px] text-text-secondary">
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {card.links && card.links.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {card.links.map((link, i) => (
            <a
              key={i}
              href={link.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-text-secondary underline transition-colors hover:text-text"
            >
              <LinkIcon size={9} strokeWidth={1.5} />
              {link.label ?? link.uri}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
