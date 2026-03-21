import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Sidebar } from "./components/layout/Sidebar";
import { InboxView } from "./pages/InboxView";
import { TodayView } from "./pages/TodayView";
import { NextView } from "./pages/NextView";
import { ProjectsView } from "./pages/ProjectsView";
import { AreasView } from "./pages/AreasView";
import { WaitingView } from "./pages/WaitingView";
import { SomedayView } from "./pages/SomedayView";
import { ReferenceView } from "./pages/ReferenceView";
import { ActionCenter } from "./pages/ActionCenter";

function Layout() {
  return (
    <div className="grid-bg flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-mono text-xs text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <span className="font-mono text-xs text-text-muted">Please log in to continue</span>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-accent text-white px-4 py-2 font-mono text-xs hover:opacity-90"
        >
          Log in
        </button>
      </div>
    );
  }

  return <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="callback" element={
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-xs text-text-muted">Authenticating...</span>
          </div>
        } />
        <Route element={<AuthGate />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="inbox" element={<InboxView />} />
          <Route path="action" element={<ActionCenter />} />
          <Route path="today" element={<TodayView />} />
          <Route path="next" element={<NextView />} />
          <Route path="projects" element={<ProjectsView />} />
          <Route path="areas" element={<AreasView />} />
          <Route path="waiting" element={<WaitingView />} />
          <Route path="someday" element={<SomedayView />} />
          <Route path="reference" element={<ReferenceView />} />
        </Route>
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
