import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Check,
  AlertTriangle,
  Mail,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Link,
  Unlink,
} from "lucide-react";
import {
  useSettings,
  useUpdateSettings,
  useTestEmail,
  useDisconnectEmail,
} from "../lib/hooks/use-settings";
import type { EmailAccountInput } from "../lib/types";

const API_URL = import.meta.env.VITE_API_URL;

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI (ChatGPT)" },
] as const;

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
};

type EmailProvider = "gmail" | "outlook" | "custom";

const EMAIL_PROVIDERS: { value: EmailProvider; label: string }[] = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "custom", label: "Custom IMAP" },
];

const PROVIDER_DEFAULTS: Record<
  string,
  { imap_host: string; imap_port: number; smtp_host: string; smtp_port: number }
> = {
  gmail: {
    imap_host: "imap.gmail.com",
    imap_port: 993,
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
  },
  outlook: {
    imap_host: "outlook.office365.com",
    imap_port: 993,
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
  },
};

const PROVIDER_HELP: Record<string, string> = {
  gmail:
    "Create an app password at myaccount.google.com/apppasswords. You need 2FA enabled.",
  outlook:
    "Create an app password at account.microsoft.com/security",
};

function providerBadgeColor(provider: string): string {
  switch (provider) {
    case "gmail":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "outlook":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    default:
      return "bg-neutral-500/15 text-neutral-400 border-neutral-500/30";
  }
}

function providerLabel(provider: string): string {
  switch (provider) {
    case "gmail":
      return "Gmail";
    case "outlook":
      return "Outlook";
    default:
      return "Custom";
  }
}

interface LocalEmailAccount extends EmailAccountInput {
  /** Whether this account already has a password on the server */
  has_password_on_server: boolean;
  /** Whether this account has OAuth tokens on the server */
  has_oauth_on_server: boolean;
  /** Local password field (empty string = keep existing) */
  local_password: string;
}

// ── Main Settings View ──────────────────────────────────────

export function SettingsView() {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();
  const testEmail = useTestEmail();
  const disconnectEmail = useDisconnectEmail();
  const [searchParams, setSearchParams] = useSearchParams();

  // LLM state
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Email accounts state
  const [emailAccounts, setEmailAccounts] = useState<LocalEmailAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<EmailProvider>("gmail");
  const [testResults, setTestResults] = useState<
    Record<number, { success: boolean; error?: string; testing: boolean }>
  >({});

  // Check URL params for OAuth callback results
  useEffect(() => {
    const emailConnected = searchParams.get("email_connected");
    const emailError = searchParams.get("email_error");

    if (emailConnected) {
      setFeedback({
        type: "success",
        message: `${providerLabel(emailConnected)} account connected successfully`,
      });
      // Clean up URL params
      searchParams.delete("email_connected");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setFeedback(null), 5000);
    } else if (emailError) {
      setFeedback({
        type: "error",
        message: `Failed to connect email: ${emailError}`,
      });
      searchParams.delete("email_error");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setFeedback(null), 5000);
    }
  }, [searchParams, setSearchParams]);

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider ?? "anthropic");
      setModel(
        settings.model ?? DEFAULT_MODELS[settings.provider ?? "anthropic"] ?? "",
      );
      setEmailAccounts(
        settings.email_accounts.map((a) => ({
          name: a.name,
          provider: a.provider,
          email: a.email,
          imap_host: a.imap_host,
          imap_port: a.imap_port,
          smtp_host: a.smtp_host,
          smtp_port: a.smtp_port,
          enabled: a.enabled,
          sync_interval_secs: a.sync_interval_secs,
          has_password_on_server: a.has_password,
          has_oauth_on_server: a.has_oauth,
          local_password: "",
        })),
      );
    }
  }, [settings]);

  function handleProviderChange(newProv: string) {
    setProvider(newProv);
    const oldDefault = DEFAULT_MODELS[provider];
    if (!model || model === oldDefault) {
      setModel(DEFAULT_MODELS[newProv] ?? "");
    }
  }

  function handleSave() {
    setFeedback(null);

    const emailAccountsPayload: EmailAccountInput[] = emailAccounts.map(
      (a) => ({
        name: a.name,
        provider: a.provider,
        email: a.email,
        password: a.local_password || undefined,
        imap_host: a.provider === "custom" ? a.imap_host : undefined,
        imap_port: a.provider === "custom" ? a.imap_port : undefined,
        smtp_host: a.provider === "custom" ? a.smtp_host : undefined,
        smtp_port: a.provider === "custom" ? a.smtp_port : undefined,
        enabled: a.enabled,
        sync_interval_secs: a.sync_interval_secs,
      }),
    );

    updateSettings.mutate(
      {
        provider,
        ...(apiKey ? { api_key: apiKey } : {}),
        model: model || undefined,
        email_accounts: emailAccountsPayload,
      },
      {
        onSuccess: () => {
          setApiKey("");
          setFeedback({ type: "success", message: "Settings saved" });
          setTimeout(() => setFeedback(null), 3000);
        },
        onError: (err) => {
          setFeedback({
            type: "error",
            message: (err as Error).message || "Failed to save settings",
          });
        },
      },
    );
  }

  function addEmailAccount() {
    const defaults = PROVIDER_DEFAULTS[newProvider];
    const acct: LocalEmailAccount = {
      name: "",
      provider: newProvider,
      email: "",
      imap_host: defaults?.imap_host,
      imap_port: defaults?.imap_port,
      smtp_host: defaults?.smtp_host,
      smtp_port: defaults?.smtp_port,
      enabled: true,
      has_password_on_server: false,
      has_oauth_on_server: false,
      local_password: "",
    };
    setEmailAccounts((prev) => [...prev, acct]);
    setShowAddForm(false);
  }

  function removeEmailAccount(index: number) {
    setEmailAccounts((prev) => prev.filter((_, i) => i !== index));
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function handleDisconnectEmail(index: number) {
    disconnectEmail.mutate(index, {
      onSuccess: () => {
        setFeedback({ type: "success", message: "Email account disconnected" });
        setTimeout(() => setFeedback(null), 3000);
      },
      onError: (err) => {
        setFeedback({
          type: "error",
          message: (err as Error).message || "Failed to disconnect account",
        });
      },
    });
  }

  function updateEmailAccount(
    index: number,
    field: keyof LocalEmailAccount,
    value: string | boolean | number | undefined,
  ) {
    setEmailAccounts((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const updated = { ...a, [field]: value };
        // Auto-generate name from provider + email
        if (field === "email" || field === "provider") {
          const email = field === "email" ? (value as string) : a.email;
          const prov = field === "provider" ? (value as string) : a.provider;
          if (email) {
            updated.name = `${providerLabel(prov)} - ${email}`;
          }
        }
        return updated;
      }),
    );
  }

  function handleTestConnection(index: number) {
    setTestResults((prev) => ({
      ...prev,
      [index]: { success: false, testing: true },
    }));

    testEmail.mutate(index, {
      onSuccess: (result) => {
        setTestResults((prev) => ({
          ...prev,
          [index]: {
            success: result.success,
            error: result.error,
            testing: false,
          },
        }));
      },
      onError: (err) => {
        setTestResults((prev) => ({
          ...prev,
          [index]: {
            success: false,
            error: (err as Error).message,
            testing: false,
          },
        }));
      },
    });
  }

  function handleConnectOAuth(provider: "gmail" | "outlook") {
    // Redirect to server OAuth start endpoint (full page redirect)
    window.location.href = `${API_URL}/api/auth/${provider}/start`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">
          Failed to load settings: {(error as Error)?.message}
        </span>
      </div>
    );
  }

  // Separate OAuth-connected accounts from manually-configured ones
  const oauthAccounts = emailAccounts.filter((a) => a.has_oauth_on_server);
  const manualAccounts = emailAccounts.filter((a) => !a.has_oauth_on_server);

  // Check which OAuth providers are already connected
  const hasGmailOAuth = oauthAccounts.some((a) => a.provider === "gmail");
  const hasOutlookOAuth = oauthAccounts.some((a) => a.provider === "outlook");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl space-y-6 p-6">
          {/* LLM Configuration */}
          <div className="border border-border bg-bg-panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <SettingsIcon
                size={14}
                strokeWidth={1.5}
                className="text-text-secondary"
              />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
                LLM Configuration
              </h2>
            </div>

            {/* Provider */}
            <div className="mb-4">
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text outline-none"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  settings?.has_key ? "Key is set" : "No key configured"
                }
                className="w-full border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
              />
              {settings?.has_key && !apiKey && (
                <span className="mt-1 block font-mono text-[10px] text-text-muted">
                  Leave blank to keep existing key
                </span>
              )}
            </div>

            {/* Model */}
            <div className="mb-4">
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider] ?? ""}
                className="w-full border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Email Accounts */}
          <div className="border border-border bg-bg-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail
                  size={14}
                  strokeWidth={1.5}
                  className="text-text-secondary"
                />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Email Accounts
                </h2>
              </div>

              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted transition-colors hover:text-text"
                >
                  <Plus size={12} strokeWidth={2} />
                  Add Manual
                </button>
              )}
            </div>

            {/* OAuth connect buttons */}
            <div className="mb-4 flex items-center gap-3">
              {!hasGmailOAuth && (
                <button
                  type="button"
                  onClick={() => handleConnectOAuth("gmail")}
                  className="inline-flex items-center gap-1.5 border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Link size={11} strokeWidth={2} />
                  Connect Gmail
                </button>
              )}
              {!hasOutlookOAuth && (
                <button
                  type="button"
                  onClick={() => handleConnectOAuth("outlook")}
                  className="inline-flex items-center gap-1.5 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-mono text-[10px] font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Link size={11} strokeWidth={2} />
                  Connect Outlook
                </button>
              )}
            </div>

            {/* OAuth-connected accounts */}
            {oauthAccounts.length > 0 && (
              <div className="mb-4 space-y-3">
                {oauthAccounts.map((account, _localIdx) => {
                  // Find the real index in the full emailAccounts array
                  const realIndex = emailAccounts.indexOf(account);
                  return (
                    <OAuthAccountCard
                      key={realIndex}
                      account={account}
                      index={realIndex}
                      onDisconnect={handleDisconnectEmail}
                      isDisconnecting={disconnectEmail.isPending}
                    />
                  );
                })}
              </div>
            )}

            {/* Add manual account form */}
            {showAddForm && (
              <div className="mb-4 border border-border bg-bg p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    New Manual Account
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-text-muted transition-colors hover:text-text"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
                <div className="mb-3">
                  <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    Provider
                  </label>
                  <select
                    value={newProvider}
                    onChange={(e) =>
                      setNewProvider(e.target.value as EmailProvider)
                    }
                    className="w-full border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text outline-none"
                  >
                    {EMAIL_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addEmailAccount}
                  className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80"
                >
                  <Plus size={11} strokeWidth={2} />
                  Add
                </button>
              </div>
            )}

            {/* Manual account list */}
            {manualAccounts.length === 0 &&
              oauthAccounts.length === 0 &&
              !showAddForm && (
                <p className="font-mono text-[10px] text-text-muted">
                  No email accounts configured. Connect Gmail or Outlook above,
                  or add a manual IMAP account.
                </p>
              )}

            <div className="space-y-3">
              {manualAccounts.map((account, _localIdx) => {
                const realIndex = emailAccounts.indexOf(account);
                return (
                  <EmailAccountCard
                    key={realIndex}
                    account={account}
                    index={realIndex}
                    testResult={testResults[realIndex]}
                    onUpdate={updateEmailAccount}
                    onRemove={removeEmailAccount}
                    onTest={handleTestConnection}
                  />
                );
              })}
            </div>
          </div>

          {/* Save button + feedback */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Save
            </button>

            {feedback && (
              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                  feedback.type === "success"
                    ? "text-green-500"
                    : "text-red-400"
                }`}
              >
                {feedback.type === "success" ? (
                  <Check size={11} strokeWidth={2} />
                ) : (
                  <AlertTriangle size={11} strokeWidth={2} />
                )}
                {feedback.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OAuth Account Card ────────────────────────────────────────

function OAuthAccountCard({
  account,
  index,
  onDisconnect,
  isDisconnecting,
}: {
  account: LocalEmailAccount;
  index: number;
  onDisconnect: (index: number) => void;
  isDisconnecting: boolean;
}) {
  return (
    <div className="border border-border bg-bg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${providerBadgeColor(account.provider)}`}
          >
            {providerLabel(account.provider)}
          </span>
          <span className="font-mono text-xs text-text-secondary">
            {account.email}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-green-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-green-400 border border-green-500/30">
            <Check size={9} strokeWidth={2.5} />
            Connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5">
            <span className="font-mono text-[10px] text-text-muted">
              {account.enabled ? "Enabled" : "Disabled"}
            </span>
          </label>
          <button
            type="button"
            onClick={() => onDisconnect(index)}
            disabled={isDisconnecting}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted transition-colors hover:text-red-400 disabled:opacity-50"
            title="Disconnect account"
          >
            <Unlink size={11} strokeWidth={2} />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Email Account Card ───────────────────────────────────────

function EmailAccountCard({
  account,
  index,
  testResult,
  onUpdate,
  onRemove,
  onTest,
}: {
  account: LocalEmailAccount;
  index: number;
  testResult?: { success: boolean; error?: string; testing: boolean };
  onUpdate: (
    index: number,
    field: keyof LocalEmailAccount,
    value: string | boolean | number | undefined,
  ) => void;
  onRemove: (index: number) => void;
  onTest: (index: number) => void;
}) {
  const isCustom = account.provider === "custom";
  const helpText = PROVIDER_HELP[account.provider];

  return (
    <div className="border border-border bg-bg p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${providerBadgeColor(account.provider)}`}
          >
            {providerLabel(account.provider)}
          </span>
          {account.email && (
            <span className="font-mono text-xs text-text-secondary">
              {account.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={account.enabled}
              onChange={(e) => onUpdate(index, "enabled", e.target.checked)}
              className="accent-accent"
            />
            <span className="font-mono text-[10px] text-text-muted">
              Enabled
            </span>
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-text-muted transition-colors hover:text-red-400"
            title="Remove account"
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Email */}
      <div className="mb-3">
        <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Email Address
        </label>
        <input
          type="email"
          value={account.email}
          onChange={(e) => onUpdate(index, "email", e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
        />
      </div>

      {/* App Password */}
      <div className="mb-3">
        <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
          App Password
        </label>
        <input
          type="password"
          value={account.local_password}
          onChange={(e) => onUpdate(index, "local_password", e.target.value)}
          placeholder={
            account.has_password_on_server
              ? "Password is set"
              : "Enter app password"
          }
          className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
        />
        {account.has_password_on_server && !account.local_password && (
          <span className="mt-1 block font-mono text-[10px] text-text-muted">
            Leave blank to keep existing password
          </span>
        )}
        {helpText && (
          <span className="mt-1 block font-mono text-[10px] text-text-muted">
            {helpText}
          </span>
        )}
      </div>

      {/* IMAP/SMTP for custom, readonly for gmail/outlook */}
      {isCustom ? (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              IMAP Host
            </label>
            <input
              type="text"
              value={account.imap_host ?? ""}
              onChange={(e) => onUpdate(index, "imap_host", e.target.value)}
              placeholder="imap.example.com"
              className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              IMAP Port
            </label>
            <input
              type="number"
              value={account.imap_port ?? 993}
              onChange={(e) =>
                onUpdate(index, "imap_port", parseInt(e.target.value) || 993)
              }
              className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              SMTP Host
            </label>
            <input
              type="text"
              value={account.smtp_host ?? ""}
              onChange={(e) => onUpdate(index, "smtp_host", e.target.value)}
              placeholder="smtp.example.com"
              className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              SMTP Port
            </label>
            <input
              type="number"
              value={account.smtp_port ?? 587}
              onChange={(e) =>
                onUpdate(index, "smtp_port", parseInt(e.target.value) || 587)
              }
              className="w-full border border-border bg-bg-panel px-2.5 py-1.5 font-mono text-xs text-text outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                IMAP
              </label>
              <span className="block font-mono text-[10px] text-text-muted">
                {PROVIDER_DEFAULTS[account.provider]?.imap_host}:
                {PROVIDER_DEFAULTS[account.provider]?.imap_port}
              </span>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
                SMTP
              </label>
              <span className="block font-mono text-[10px] text-text-muted">
                {PROVIDER_DEFAULTS[account.provider]?.smtp_host}:
                {PROVIDER_DEFAULTS[account.provider]?.smtp_port}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onTest(index)}
          disabled={testResult?.testing}
          className="inline-flex items-center gap-1.5 border border-border bg-bg-panel px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:text-text disabled:opacity-50"
        >
          <RefreshCw
            size={11}
            strokeWidth={2}
            className={testResult?.testing ? "animate-spin" : ""}
          />
          Test Connection
        </button>

        {testResult && !testResult.testing && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[10px] ${
              testResult.success ? "text-green-500" : "text-red-400"
            }`}
          >
            {testResult.success ? (
              <>
                <Check size={11} strokeWidth={2} />
                Connected
              </>
            ) : (
              <>
                <X size={11} strokeWidth={2} />
                {testResult.error ?? "Connection failed"}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
