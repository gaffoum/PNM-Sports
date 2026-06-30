import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PlayerList from "./pages/PlayerList";
import PlayerDetail from "./pages/PlayerDetail";
import PlayerCreate from "./pages/PlayerCreate";
import Recruitment from "./pages/Recruitment";
import Agents from "./pages/Agents";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
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
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/recrutement" element={<Recruitment />} />
            <Route path="/agents" element={<ProtectedRoute requireAdmin><Agents /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
    </AuthProvider>
  );
}
