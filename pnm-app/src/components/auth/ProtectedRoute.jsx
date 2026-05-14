import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, agent, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-dim">
        <div className="animate-pulse">Chargement…</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!agent) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div className="panel p-6 max-w-md">
          <h2 className="text-xl mb-2">Compte non autorisé</h2>
          <p className="text-ink-dim text-sm">
            Ton compte est authentifié mais n'est pas rattaché à un agent PNM. Contacte un administrateur.
          </p>
        </div>
      </div>
    );
  }
  if (requireAdmin && agent.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
