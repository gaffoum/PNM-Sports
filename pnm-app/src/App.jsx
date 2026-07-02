import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { FeatureProvider } from "./contexts/FeatureContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FeatureGate from "./components/auth/FeatureGate";
import OwnerRoute from "./components/auth/OwnerRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PlayerList from "./pages/PlayerList";
import PlayerDetail from "./pages/PlayerDetail";
import PlayerCreate from "./pages/PlayerCreate";
import PlayerCompare from "./pages/PlayerCompare";
import Recruitment from "./pages/Recruitment";
import Agents from "./pages/Agents";
import Features from "./pages/Features";
import ClubDirectory from "./pages/ClubDirectory";
import ClubDetail from "./pages/ClubDetail";
import ClubNeeds from "./pages/ClubNeeds";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <FeatureProvider>
      <ConfirmProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="bottom-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/players" element={<PlayerList />} />
            <Route path="/players/new" element={<PlayerCreate />} />
            <Route path="/players/compare" element={<FeatureGate feature="data_comparaison"><PlayerCompare /></FeatureGate>} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/recrutement" element={<Recruitment />} />
            <Route path="/clubs" element={<FeatureGate feature="placement_clubs"><ClubDirectory /></FeatureGate>} />
            <Route path="/clubs/:club" element={<FeatureGate feature="placement_clubs"><ClubDetail /></FeatureGate>} />
            <Route path="/besoins-clubs" element={<FeatureGate feature="placement_besoins_clubs"><ClubNeeds /></FeatureGate>} />
            <Route path="/agents" element={<ProtectedRoute requireAdmin><Agents /></ProtectedRoute>} />
            <Route path="/features" element={<ProtectedRoute requireAdmin><OwnerRoute><Features /></OwnerRoute></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
      </FeatureProvider>
    </AuthProvider>
  );
}
