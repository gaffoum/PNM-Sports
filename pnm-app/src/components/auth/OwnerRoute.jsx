import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isOwner } from "../../lib/ownership";

// Réservé au compte SuperAdmin (propriétaire) — même un autre administrateur
// n'y a pas accès. Redirection silencieuse, comme FeatureGate/ProtectedRoute.
export default function OwnerRoute({ children }) {
  const { agent } = useAuth();
  if (!isOwner(agent)) return <Navigate to="/dashboard" replace />;
  return children;
}
