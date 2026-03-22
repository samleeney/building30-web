import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Check,
  AlertTriangle,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSettings, useUpdateSettings } from "../lib/hooks/use-settings";
import {
  usePlugins,
  usePluginConfig,
  useUpdatePlugin,
  useSyncPlugin,
} from "../lib/hooks/use-plugins";
import type { PluginInfo, ConfigField, SyncReport } from "../lib/types";

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI (ChatGPT)" },
] as const;

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
};

// ── Plugin Config Form ──────────────────────────────────────

function PluginConfigForm({ plugin }: { plugin: PluginInfo }) {
  const { data: pluginData, isLoading } = usePluginConfig(plugin.name);
  const updatePlugin = useUpdatePlugin(plugin.name);
  const syncPlugin = useSyncPlugin(plugin.name);

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<SyncReport | null>(null);

  // Populate form when config loads
  useEffect(() => {
    if (pluginData?.config) {
      setFormValues({ ...pluginData.config });
    }
  }, [pluginData]);

  function handleFieldChange(key: string, value: unknown) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setFeedback(null);
    // Only send fields that differ from current config (or new fields)
    const changed: Record<string, unknown> = {};
    for (const field of plugin.config_schema) {
      const newVal = formValues[field.key];
      const oldVal = pluginData?.config?.[field.key];
      if (newVal !== oldVal && newVal !== undefined) {
        // Empty string means "remove" for password/text fields
        changed[field.key] = newVal === "" ? "" : newVal;
      }
    }

    if (Object.keys(changed).length === 0) {
      setFeedback({ type: "success", message: "No changes" });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    updatePlugin.mutate(changed, {
      onSuccess: () => {
        setFeedback({ type: "success", message: "Saved" });
        setTimeout(() => setFeedback(null), 3000);
      },
      onError: (err) => {
        setFeedback({
          type: "error",
          message: (err as Error).message || "Failed to save",
        });
      },
    });
  }

  function handleSync() {
    setSyncResult(null);
    setFeedback(null);
    syncPlugin.mutate(undefined, {
      onSuccess: (report) => {
        setSyncResult(report);
      },
      onError: (err) => {
        setFeedback({
          type: "error",
          message: (err as Error).message || "Sync failed",
        });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="py-3 font-mono text-[10px] text-text-muted">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {plugin.config_schema.map((field) => (
        <ConfigFieldInput
          key={field.key}
          field={field}
          value={formValues[field.key]}
          masked={
            field.field_type === "password" &&
            pluginData?.config?.[field.key] === "********"
          }
          onChange={(val) => handleFieldChange(field.key, val)}
        />
      ))}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={updatePlugin.isPending}
          className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          Save
        </button>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncPlugin.isPending}
          className="inline-flex items-center gap-1.5 border border-border bg-bg px-3 py-1.5 font-mono text-[10px] font-medium text-text-secondary transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <RefreshCw
            size={10}
            strokeWidth={2}
            className={syncPlugin.isPending ? "animate-spin" : ""}
          />
          Sync Now
        </button>

        {feedback && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[10px] ${
              feedback.type === "success" ? "text-green-500" : "text-red-400"
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

      {syncResult && (
        <div className="mt-2 border border-border bg-bg p-2 font-mono text-[10px]">
          <div className="flex items-center gap-1 text-green-500">
            <Check size={10} strokeWidth={2} />
            <span>
              Synced: {syncResult.created} created, {syncResult.updated}{" "}
              updated, {syncResult.deleted} deleted
            </span>
          </div>
          {syncResult.errors.length > 0 && (
            <div className="mt-1 text-red-400">
              {syncResult.errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual config field ─────────────────────────────────

function ConfigFieldInput({
  field,
  value,
  masked,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  masked: boolean;
  onChange: (val: unknown) => void;
}) {
  if (field.field_type === "boolean") {
    return (
      <div className="mb-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-accent"
        />
        <label className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {field.label}
        </label>
      </div>
    );
  }

  const inputType =
    field.field_type === "password"
      ? "password"
      : field.field_type === "number"
        ? "number"
        : "text";

  return (
    <div className="mb-3">
      <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {field.label}
        {field.required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type={inputType}
        value={value !== undefined && value !== null ? String(value) : ""}
        onChange={(e) =>
          onChange(
            field.field_type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
          )
        }
        placeholder={
          masked
            ? "Value is set (leave blank to keep)"
            : field.placeholder ?? ""
        }
        className="w-full border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text outline-none placeholder:text-text-muted"
      />
      {masked && !(value as string) && (
        <span className="mt-1 block font-mono text-[10px] text-text-muted">
          Leave blank to keep existing value
        </span>
      )}
    </div>
  );
}

// ── Plugin Card ─────────────────────────────────────────────

function PluginCard({ plugin }: { plugin: PluginInfo }) {
  const [expanded, setExpanded] = useState(false);

  const lastSync = plugin.last_sync
    ? new Date(plugin.last_sync).toLocaleString()
    : "Never";

  return (
    <div className="border border-border bg-bg-panel p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 inline-block h-2 w-2 shrink-0 ${
              plugin.enabled ? "bg-green-500" : "bg-neutral-500"
            }`}
            title={plugin.enabled ? "Enabled" : "Disabled"}
          />
          <div>
            <div className="font-mono text-xs font-medium text-text">
              {plugin.display_name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-text-muted">
              {plugin.description}
            </div>
            <div className="mt-1 font-mono text-[10px] text-text-muted">
              Last sync: {lastSync}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-text-secondary transition-opacity hover:opacity-70"
        >
          {expanded ? (
            <ChevronDown size={12} strokeWidth={2} />
          ) : (
            <ChevronRight size={12} strokeWidth={2} />
          )}
          Configure
        </button>
      </div>

      {expanded && <PluginConfigForm plugin={plugin} />}
    </div>
  );
}

// ── Main Settings View ──────────────────────────────────────

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

          {/* Data Sources */}
          <DataSourcesSection />
        </div>
      </div>
    </div>
  );
}

// ── Data Sources Section ────────────────────────────────────

function DataSourcesSection() {
  const { data: plugins, isLoading, error } = usePlugins();

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Database size={14} strokeWidth={1.5} className="text-text-secondary" />
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Data Sources
        </h2>
      </div>

      {isLoading && (
        <div className="border border-border bg-bg-panel p-4 font-mono text-[10px] text-text-muted">
          Loading plugins...
        </div>
      )}

      {error && (
        <div className="border border-border bg-bg-panel p-4 font-mono text-[10px] text-red-400">
          Failed to load plugins: {(error as Error)?.message}
        </div>
      )}

      {plugins && plugins.length === 0 && (
        <div className="border border-border bg-bg-panel p-4 font-mono text-[10px] text-text-muted">
          No plugins registered.
        </div>
      )}

      {plugins && plugins.length > 0 && (
        <div className="flex flex-col gap-3">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.name} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  );
}
