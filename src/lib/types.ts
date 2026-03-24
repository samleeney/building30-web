// ── Card types ──────────────────────────────────────────────

export type CardType =
  | "task"
  | "project"
  | "inbox"
  | "reference"
  | "someday"
  | "waiting";

/** Lightweight card for list views */
export interface Card {
  id: string;
  title: string;
  card_type: CardType;
  tags: string[];
  status: string | null;
  due: string | null;
  start: string | null;
  project_names: string[];
  summary: string | null;
  path: string;
  created_at: string;
  modified_at: string;
}

/** Full card with body and metadata */
export interface CardDetail extends Card {
  body: string | null;
  tasks: string[] | null;
  next_task: string | null;
  goal: string | null;
  recurrence: string | null;
  data: unknown | null;
  project?: string | null;
  due_display?: string | null;
  start_display?: string | null;
  time_estimate?: string | null;
  energy?: string | null;
  mime_type?: string | null;
  links?: LinkInfo[];
  depends?: string[];
  blocked?: boolean | null;
}

export interface LinkInfo {
  uri: string;
  label: string | null;
}

// ── Project context ─────────────────────────────────────────

export interface ProjectContext {
  project: ProjectSummary;
  next_actions: TaskItem[];
  waiting_for: TaskItem[];
  other_tasks: TaskItem[];
  references: TaskItem[];
  linked_materials: LinkedMaterial[];
  recent_completions: RecentCompletion[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  goal: string | null;
  status: string | null;
  due: string | null;
  tags: string[];
  next_task: string | null;
  effective_next_task: string | null;
  effective_next_task_source: "explicit" | "auto" | null;
  effective_next_task_actionable: boolean | null;
  actionable_task_count: number | null;
}

export interface TaskItem {
  id: string;
  title: string;
  card_type: string;
  status: string | null;
  due: string | null;
  start: string | null;
  tags: string[];
}

export interface LinkedMaterial {
  uri: string;
  label: string | null;
  resolved_title: string | null;
  card_type: string | null;
}

export interface RecentCompletion {
  title: string;
  completed_at: string;
}

// ── SSE events ──────────────────────────────────────────────

export type ServerEvent =
  | { type: "card_upsert"; id: string }
  | { type: "card_delete"; id: string }
  | { type: "hello"; data: string };

// ── Tag statistics ──────────────────────────────────────────

export interface TagStat {
  tag: string;
  count: number;
  rollup_count?: number | null;
  by_type?: Record<string, number>;
  rollup_by_type?: Record<string, number> | null;
  has_definition?: boolean;
  definition_title?: string | null;
  has_children?: boolean;
  deprecated?: boolean;
  deprecated_in_favour_of?: string | null;
}

// ── Settings ─────────────────────────────────────────────────

export interface Settings {
  provider: string | null;
  has_key: boolean;
  model: string | null;
}

export interface UpdateSettingsRequest {
  provider?: string;
  api_key?: string;
  model?: string;
}

// ── API response envelopes ──────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
}

export interface DataResponse<T> {
  data: T;
}

export interface MessageResponse {
  message: string;
  count?: number;
}

export interface UpdateResponse {
  count: number;
  affected_ids: string[];
  errors: OperationError[];
  message: string;
  cards?: CardDetail[];
  truncated: boolean;
  warnings: string[];
  unblocked_cards: { id: string; title: string }[];
}

export interface OperationError {
  id: string;
  error: string;
}
