import { useSearchParams } from "react-router-dom";
import {
  FolderOpen,
  X,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Hourglass,
  FileText,
  Target,
  Link as LinkIcon,
} from "lucide-react";
import { useCards } from "../lib/hooks/use-cards";
import { useProjectContext } from "../lib/hooks/use-project-context";
import { useEventStream } from "../lib/hooks/use-event-stream";
import type { TaskItem, ProjectContext, LinkedMaterial, RecentCompletion } from "../lib/types";

export function ProjectsView() {
  useEventStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("project") ?? undefined;

  const { data, isLoading, error } = useCards({ type: "project" });
  const projects = data?.data ?? [];

  function handleSelect(id: string) {
    setSearchParams(id === selectedId ? {} : { project: id });
  }

  function handleClose() {
    setSearchParams({});
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-mono text-sm font-semibold tracking-wider text-text-secondary uppercase">
            Projects
          </h1>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <span className="font-mono text-xs">Failed to load projects</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-muted">
            <FolderOpen size={24} strokeWidth={1} />
            <span className="font-mono text-xs">No projects</span>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project.id)}
                className={`flex w-full items-center gap-2 border-b border-border-subtle px-4 py-2.5 text-left transition-colors ${
                  project.id === selectedId
                    ? "bg-bg-active"
                    : "hover:bg-bg-hover"
                }`}
              >
                <FolderOpen size={14} strokeWidth={1.5} className="shrink-0 text-text-muted" />
                <span className="flex-1 truncate text-sm font-medium text-text">
                  {project.title}
                </span>
                {project.status && (
                  <span className="font-mono text-[10px] text-text-muted">
                    {project.status}
                  </span>
                )}
                {project.due && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
                    <Calendar size={10} strokeWidth={1.5} />
                    {project.due}
                  </span>
                )}
                <ChevronRight size={12} strokeWidth={1.5} className="shrink-0 text-text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedId && (
        <div className="w-96 shrink-0 border-l border-border overflow-y-auto">
          <ProjectDetail projectId={selectedId} onClose={handleClose} />
        </div>
      )}
    </div>
  );
}

function ProjectDetail({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useProjectContext(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <span className="font-mono text-xs">Failed to load project</span>
      </div>
    );
  }

  return <ProjectDetailInner context={data} onClose={onClose} />;
}

function ProjectDetailInner({
  context,
  onClose,
}: {
  context: ProjectContext;
  onClose: () => void;
}) {
  const { project, next_actions, waiting_for, other_tasks, references, linked_materials, recent_completions } = context;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-text">{project.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted transition-colors hover:text-text"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Goal */}
        {project.goal && (
          <div className="flex items-start gap-2">
            <Target size={12} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-muted" />
            <p className="font-mono text-xs text-text-secondary">{project.goal}</p>
          </div>
        )}

        {/* Project metadata */}
        <div className="flex flex-wrap items-center gap-2">
          {project.status && (
            <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
              {project.status}
            </span>
          )}
          {project.due && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
              <Calendar size={10} strokeWidth={1.5} />
              {project.due}
            </span>
          )}
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] text-text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Next task */}
        {project.effective_next_task && (
          <div className="border border-border bg-bg-panel px-3 py-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Next Task
            </span>
            <p className="mt-0.5 text-xs font-medium text-text">
              {project.effective_next_task}
            </p>
          </div>
        )}

        {/* Task sections */}
        <TaskSection
          title="Next Actions"
          icon={<ChevronRight size={12} strokeWidth={1.5} />}
          tasks={next_actions}
        />
        <TaskSection
          title="Waiting For"
          icon={<Hourglass size={12} strokeWidth={1.5} />}
          tasks={waiting_for}
        />
        <TaskSection
          title="Other Tasks"
          icon={<Clock size={12} strokeWidth={1.5} />}
          tasks={other_tasks}
        />
        <TaskSection
          title="References"
          icon={<FileText size={12} strokeWidth={1.5} />}
          tasks={references}
        />

        {/* Linked materials */}
        {linked_materials.length > 0 && (
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Linked Materials
            </span>
            <div className="mt-1.5 flex flex-col gap-1">
              {linked_materials.map((mat, i) => (
                <MaterialItem key={i} material={mat} />
              ))}
            </div>
          </div>
        )}

        {/* Recent completions */}
        {recent_completions.length > 0 && (
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Recently Completed
            </span>
            <div className="mt-1.5 flex flex-col gap-1">
              {recent_completions.map((item, i) => (
                <CompletionItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskSection({
  title,
  icon,
  tasks,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: TaskItem[];
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-text-muted">
        {icon}
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider">
          {title}
        </span>
        <span className="font-mono text-[10px] text-text-muted">({tasks.length})</span>
      </div>
      <div className="mt-1.5 flex flex-col">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 border-b border-border-subtle px-2 py-1.5"
          >
            <span className="flex-1 truncate text-xs text-text">{task.title}</span>
            {task.status && (
              <span className="font-mono text-[10px] text-text-muted">{task.status}</span>
            )}
            {task.due && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
                <Calendar size={9} strokeWidth={1.5} />
                {task.due}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialItem({ material }: { material: LinkedMaterial }) {
  return (
    <a
      href={material.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-text-secondary underline transition-colors hover:text-text"
    >
      <LinkIcon size={9} strokeWidth={1.5} />
      {material.resolved_title ?? material.label ?? material.uri}
    </a>
  );
}

function CompletionItem({ item }: { item: RecentCompletion }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <CheckCircle2 size={10} strokeWidth={1.5} className="shrink-0 text-text-muted" />
      <span className="flex-1 truncate text-xs text-text-muted line-through">
        {item.title}
      </span>
      <span className="font-mono text-[10px] text-text-muted">
        {item.completed_at}
      </span>
    </div>
  );
}
