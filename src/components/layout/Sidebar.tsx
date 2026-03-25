import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Sun,
  ArrowRight,
  FolderKanban,
  Layers,
  Clock,
  Lightbulb,
  BookOpen,
  Mail,
  Zap,
  Plus,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { useEmails } from "../../lib/hooks/use-emails";
import { NewCardDialog } from "../NewCardDialog";

const navItems = [
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/action", label: "Action Center", icon: Zap },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/next", label: "Next", icon: ArrowRight },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/areas", label: "Areas", icon: Layers },
  { to: "/waiting", label: "Waiting", icon: Clock },
  { to: "/someday", label: "Someday", icon: Lightbulb },
  { to: "/reference", label: "Reference", icon: BookOpen },
] as const;

export function Sidebar() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } =
    useAuth0();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <aside className="flex h-full w-48 flex-col border-r border-border bg-bg-panel">
        <div className="border-b border-border px-4 py-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary uppercase">
            Building30
          </span>
        </div>

        {isAuthenticated && (
          <div className="px-2 pt-2">
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 border border-border bg-bg px-2.5 py-1.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              <span className="font-mono text-xs">New Card</span>
            </button>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to} label={label} icon={Icon} isAuthenticated={isAuthenticated} />
          ))}
        </nav>

        <div className="border-t border-border p-2">
          {isLoading ? (
            <div className="px-2.5 py-1.5">
              <span className="font-mono text-xs text-text-muted">...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="flex flex-col gap-1">
              {user?.name && (
                <span className="truncate px-2.5 font-mono text-xs text-text-muted">
                  {user.name}
                </span>
              )}
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text"
                  }`
                }
              >
                <Settings size={15} strokeWidth={1.5} />
                Settings
              </NavLink>
              <button
                type="button"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text transition-colors"
              >
                <LogOut size={15} strokeWidth={1.5} />
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => loginWithRedirect()}
              className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text transition-colors"
            >
              <LogIn size={15} strokeWidth={1.5} />
              Log in
            </button>
          )}
        </div>
      </aside>

      <NewCardDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  isAuthenticated,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isAuthenticated: boolean;
}) {
  // Only fetch email count for the Emails nav item when authenticated
  const showBadge = to === "/emails" && isAuthenticated;

  return (
    <NavLink
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
      <span className="flex-1">{label}</span>
      {showBadge && <EmailBadge />}
    </NavLink>
  );
}

function EmailBadge() {
  const { data } = useEmails();
  const count = data?.data?.length ?? 0;

  if (count === 0) return null;

  return (
    <span className="inline-flex min-w-[18px] items-center justify-center bg-accent px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-white">
      {count}
    </span>
  );
}
