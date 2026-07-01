import { Navigate } from "react-router-dom";
import { useFeatures } from "../../hooks/useFeatures";

// Masque une route/brique tant qu'elle n'a pas été activée (devis accepté).
// Redirige silencieusement, comme une route inconnue — aucune trace que la
// fonctionnalité existe côté client tant qu'elle est désactivée.
export default function FeatureGate({ feature, children }) {
  const { hasFeature, loading } = useFeatures();
  if (loading) return null;
  if (!hasFeature(feature)) return <Navigate to="/dashboard" replace />;
  return children;
}
