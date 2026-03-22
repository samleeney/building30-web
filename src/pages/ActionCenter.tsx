import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Archive,
  Send,
  Check,
  X,
  RotateCcw,
  Tag,
  Plus,
  User,
  Bot,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { ApiClientError } from "../lib/api-client";
import { useEventStream } from "../lib/hooks/use-event-stream";
import { useCard } from "../lib/hooks/use-cards";
import {
  useActionQueue,
  useTriage,
  useArchiveCard,
  useDrafts,
  useApproveDraft,
  useRejectDraft,
  useReviseDraft,
} from "../lib/hooks/use-action-center";
import type { Card, CardDetail as CardDetailType } from "../lib/types";

type Tab = "triage" | "drafts";

export function ActionCenter() {
  useEventStream();
  const [activeTab, setActiveTab] = useState<Tab>("triage");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
            Action Center
          </h1>
          <div className="flex">
            <TabButton
              label="Triage"
              active={activeTab === "triage"}
              onClick={() => setActiveTab("triage")}
            />
            <TabButton
              label="Drafts"
              active={activeTab === "drafts"}
              onClick={() => setActiveTab("drafts")}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "triage" ? <TriageSection /> : <DraftReviewSection />}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors ${
        active
          ? "bg-accent text-white"
          : "bg-bg-panel text-text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

// ── Triage ──────────────────────────────────────────────────

function TriageSection() {
  const { data: queue, isLoading, error } = useActionQueue();
  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = queue?.data ?? [];
  const clampedIndex = cards.length > 0
    ? Math.min(currentIndex, cards.length - 1)
    : 0;
  const currentCard = cards[clampedIndex] as Card | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Loading action queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Failed to load action queue</span>
      </div>
    );
  }

  if (cards.length === 0 || !currentCard) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Zap size={24} strokeWidth={1} className="text-text-muted" />
        <span className="font-mono text-xs text-text-muted">
          Action queue is empty — nothing to triage
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Counter + navigation */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted">
          Card {clampedIndex + 1} of {cards.length}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={clampedIndex === 0}
            className="p-1 text-text-muted transition-colors hover:text-text disabled:opacity-30"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((i) => Math.min(cards.length - 1, i + 1))
            }
            disabled={clampedIndex >= cards.length - 1}
            className="p-1 text-text-muted transition-colors hover:text-text disabled:opacity-30"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <TriageWizard key={currentCard.id} card={currentCard} />
    </div>
  );
}

function TriageWizard({ card }: { card: Card }) {
  const { data: fullCard } = useCard(card.id);
  const triage = useTriage();
  const archive = useArchiveCard();

  const [assigned, setAssigned] = useState<"human" | "llm">("human");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [project, setProject] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [isLlmNotConfigured, setIsLlmNotConfigured] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
    setShowTagInput(false);
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKey(e: KeyboardEvent) {
    if (e.key === "Enter") addTag();
    if (e.key === "Escape") {
      setTagInput("");
      setShowTagInput(false);
    }
  }

  function handleSubmit() {
    setTriageError(null);
    setIsLlmNotConfigured(false);
    triage.mutate(
      {
        id: card.id,
        assigned,
        tags: tags.length > 0 ? tags : undefined,
        project_id: project || undefined,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => {
          if (err instanceof ApiClientError && err.code === "llm_not_configured") {
            setIsLlmNotConfigured(true);
            setTriageError(err.message);
          } else {
            setTriageError((err as Error).message || "Failed to triage card");
          }
        },
      },
    );
  }

  function handleArchive() {
    archive.mutate(card.id, {
      onSuccess: () => setSubmitted(true),
    });
  }

  const busy = triage.isPending || archive.isPending || submitted;

  // Body text: use full card body if loaded, otherwise summary
  const bodyText = fullCard?.body ?? card.summary;

  return (
    <>
      {/* Card display */}
      <div className="border border-border bg-bg-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex shrink-0 bg-text-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase leading-none text-white">
            {card.card_type}
          </span>
          <h2 className="text-base font-semibold text-text">{card.title}</h2>
        </div>

        {card.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
              >
                <Tag size={9} strokeWidth={1.5} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {bodyText ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
            {bodyText}
          </pre>
        ) : (
          <span className="font-mono text-xs text-text-muted italic">
            No body
          </span>
        )}

        {fullCard && <TriageMetadata card={fullCard} />}
      </div>

      {/* Triage controls */}
      <div className="mt-4 flex flex-col gap-4 border border-border p-4">
        {/* Assign */}
        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Assign to
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setAssigned("human")
              }
              disabled={busy}
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] font-medium transition-colors disabled:opacity-50 ${
                assigned === "human"
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary hover:text-text"
              }`}
            >
              <User size={12} strokeWidth={1.5} />
              Human
            </button>
            <button
              type="button"
              onClick={() =>
                setAssigned("llm")
              }
              disabled={busy}
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] font-medium transition-colors disabled:opacity-50 ${
                assigned === "llm"
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary hover:text-text"
              }`}
            >
              <Bot size={12} strokeWidth={1.5} />
              LLM
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Add Tags
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
              >
                <Tag size={9} strokeWidth={1.5} />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={busy}
                  className="text-text-muted transition-colors hover:text-text disabled:opacity-50"
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
                className="w-24 border-b border-border bg-transparent font-mono text-[10px] text-text outline-none placeholder:text-text-muted"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                disabled={busy}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 font-mono text-[10px] text-text-muted transition-colors hover:text-text disabled:opacity-50"
              >
                <Plus size={9} strokeWidth={2} />
                tag
              </button>
            )}
          </div>
        </div>

        {/* Project */}
        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Project
          </span>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Project name or ID"
            disabled={busy}
            className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Send size={12} strokeWidth={1.5} />
          Submit
        </button>
        <button
          type="button"
          onClick={handleArchive}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[10px] font-medium text-text-secondary transition-colors hover:text-text disabled:opacity-50"
        >
          <Archive size={12} strokeWidth={1.5} />
          Archive
        </button>
      </div>

      {triageError && (
        <div className="mt-3 flex items-start gap-2 border border-red-400/30 bg-red-400/5 p-3">
          <AlertTriangle size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-red-400" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-red-400">{triageError}</span>
            {isLlmNotConfigured && (
              <Link
                to="/settings"
                className="font-mono text-[10px] text-accent underline hover:opacity-80"
              >
                Go to Settings
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TriageMetadata({ card }: { card: CardDetailType }) {
  const items: { label: string; value: string }[] = [];

  if (card.due_display || card.due)
    items.push({ label: "Due", value: card.due_display ?? card.due ?? "" });
  if (card.start_display || card.start)
    items.push({
      label: "Start",
      value: card.start_display ?? card.start ?? "",
    });
  if (card.project) items.push({ label: "Project", value: card.project });
  if (card.time_estimate)
    items.push({ label: "Estimate", value: card.time_estimate });
  if (card.energy) items.push({ label: "Energy", value: card.energy });

  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
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
    </div>
  );
}

// ── Draft Review ────────────────────────────────────────────

function DraftReviewSection() {
  const { data, isLoading, error } = useDrafts();
  const approve = useApproveDraft();
  const reject = useRejectDraft();
  const revise = useReviseDraft();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Loading drafts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Failed to load drafts</span>
      </div>
    );
  }

  const cards = data?.data ?? [];

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Bot size={24} strokeWidth={1} className="text-text-muted" />
        <span className="font-mono text-xs text-text-muted">
          No drafts to review
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <DraftCard
            key={card.id}
            card={card}
            onApprove={() => approve.mutate(card.id)}
            onReject={() => reject.mutate(card.id)}
            onRevise={() => revise.mutate(card.id)}
            isPending={
              approve.isPending || reject.isPending || revise.isPending
            }
          />
        ))}
      </div>
    </div>
  );
}

function DraftCard({
  card,
  onApprove,
  onReject,
  onRevise,
  isPending,
}: {
  card: Card;
  onApprove: () => void;
  onReject: () => void;
  onRevise: () => void;
  isPending: boolean;
}) {
  return (
    <div className="border border-border bg-bg-panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex shrink-0 bg-text-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase leading-none text-white">
          {card.card_type}
        </span>
        <h3 className="text-sm font-semibold text-text">{card.title}</h3>
      </div>

      {card.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
            >
              <Tag size={9} strokeWidth={1.5} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {card.summary && (
        <pre className="mb-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
          {card.summary}
        </pre>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Check size={12} strokeWidth={2} />
          Approve
        </button>
        <button
          type="button"
          onClick={onRevise}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[10px] font-medium text-text-secondary transition-colors hover:text-text disabled:opacity-50"
        >
          <RotateCcw size={12} strokeWidth={1.5} />
          Revise
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[10px] font-medium text-text-muted transition-colors hover:text-text disabled:opacity-50"
        >
          <X size={12} strokeWidth={1.5} />
          Reject
        </button>
      </div>
    </div>
  );
}
