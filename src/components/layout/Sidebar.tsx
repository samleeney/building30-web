import { NavLink } from "react-router-dom";
import {
  Inbox,
  Sun,
  ArrowRight,
  FolderKanban,
  Layers,
  Clock,
  Lightbulb,
  BookOpen,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/action", label: "Action", icon: Zap },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/next", label: "Next", icon: ArrowRight },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/areas", label: "Areas", icon: Layers },
  { to: "/waiting", label: "Waiting", icon: Clock },
  { to: "/someday", label: "Someday", icon: Lightbulb },
  { to: "/reference", label: "Reference", icon: BookOpen },
] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-48 flex-col border-r border-border bg-bg-panel">
      <div className="border-b border-border px-4 py-3">
        <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary uppercase">
          Building30
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text"
              }`
            }
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
