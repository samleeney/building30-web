import { useState, useEffect } from "react";
import {
  Mail,
  Inbox,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useEventStream } from "../lib/hooks/use-event-stream";
import {
  useEmails,
  useInboxEmail,
  useArchiveEmail,
} from "../lib/hooks/use-emails";

export function EmailsView() {
  useEventStream();

  const { data, isLoading, error } = useEmails();
  const inboxMutation = useInboxEmail();
  const archiveMutation = useArchiveEmail();
  const [currentIndex, setCurrentIndex] = useState(0);

  const emails = data?.data ?? [];

  const clampedIndex =
    emails.length > 0 ? Math.min(currentIndex, emails.length - 1) : 0;
  const currentEmail = emails[clampedIndex];

  // Reset index when list changes and current index is out of bounds
  useEffect(() => {
    if (currentIndex >= emails.length && emails.length > 0) {
      setCurrentIndex(Math.max(0, emails.length - 1));
    }
  }, [emails.length, currentIndex]);

  function handleInbox() {
    if (!currentEmail) return;
    inboxMutation.mutate(currentEmail.id);
  }

  function handleArchive() {
    if (!currentEmail) return;
    archiveMutation.mutate(currentEmail.id);
  }

  const busy = inboxMutation.isPending || archiveMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-xs text-text-muted">
            Loading emails...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <AlertTriangle
            size={24}
            strokeWidth={1}
            className="text-text-muted"
          />
          <span className="font-mono text-xs text-text-muted">
            Failed to load emails
          </span>
        </div>
      </div>
    );
  }

  if (emails.length === 0 || !currentEmail) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Mail size={24} strokeWidth={1} className="text-text-muted" />
          <span className="font-mono text-xs text-text-muted">
            No new emails to review
          </span>
        </div>
      </div>
    );
  }

  // Parse from field
  const fromDisplay = currentEmail.from ?? "Unknown sender";
  const subjectDisplay =
    currentEmail.subject ?? currentEmail.title ?? "(no subject)";
  const dateDisplay = currentEmail.received_date ?? "";
  const bodyDisplay = currentEmail.body ?? currentEmail.summary;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-6">
          {/* Counter + navigation */}
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted">
              Email {clampedIndex + 1} of {emails.length}
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
                  setCurrentIndex((i) => Math.min(emails.length - 1, i + 1))
                }
                disabled={clampedIndex >= emails.length - 1}
                className="p-1 text-text-muted transition-colors hover:text-text disabled:opacity-30"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Email card */}
          <div className="border border-border bg-bg-panel">
            {/* Email metadata header */}
            <div className="flex flex-col gap-2 border-b border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 border border-border-subtle bg-bg px-2 py-1 font-mono text-[11px] text-text-secondary">
                  <Mail size={11} strokeWidth={1.5} />
                  {fromDisplay}
                </span>
                {currentEmail.account && (
                  <span className="shrink-0 font-mono text-[10px] text-text-muted">
                    {currentEmail.account}
                  </span>
                )}
              </div>

              <h2 className="text-base font-semibold text-text">
                {subjectDisplay}
              </h2>

              {dateDisplay && (
                <span className="font-mono text-[10px] text-text-muted">
                  {dateDisplay}
                </span>
              )}
            </div>

            {/* Email body */}
            <div className="p-4">
              {bodyDisplay ? (
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
                  {bodyDisplay}
                </pre>
              ) : (
                <span className="font-mono text-xs text-text-muted italic">
                  No content
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInbox}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <Inbox size={12} strokeWidth={1.5} />
              Inbox
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
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="border-b border-border px-4 py-3">
      <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
        Emails
      </h1>
    </div>
  );
}
