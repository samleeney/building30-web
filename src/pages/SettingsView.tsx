import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Check, AlertTriangle } from "lucide-react";
import { useSettings, useUpdateSettings } from "../lib/hooks/use-settings";

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI (ChatGPT)" },
] as const;

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
};

export function SettingsView() {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();

  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider ?? "anthropic");
      setModel(settings.model ?? DEFAULT_MODELS[settings.provider ?? "anthropic"] ?? "");
    }
  }, [settings]);

  function handleProviderChange(newProvider: string) {
    setProvider(newProvider);
    // Update model to default for new provider if it was the default for the old one
    const oldDefault = DEFAULT_MODELS[provider];
    if (!model || model === oldDefault) {
      setModel(DEFAULT_MODELS[newProvider] ?? "");
    }
  }

  function handleSave() {
    setFeedback(null);
    updateSettings.mutate(
      {
        provider,
        ...(apiKey ? { api_key: apiKey } : {}),
        model: model || undefined,
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-6">
          {/* LLM Configuration */}
          <div className="border border-border bg-bg-panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <SettingsIcon size={14} strokeWidth={1.5} className="text-text-secondary" />
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
                placeholder={settings?.has_key ? "Key is set" : "No key configured"}
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
    </div>
  );
}
