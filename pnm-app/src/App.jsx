import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { FeatureProvider } from "./contexts/FeatureContext";
import { LanguageProvider } from "./contexts/LanguageContext";
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
import Agenda from "./pages/Agenda";
import Pipeline from "./pages/Pipeline";
import Commissions from "./pages/Commissions";
import AuditLog from "./pages/AuditLog";
import RgpdRequests from "./pages/RgpdRequests";
import Portfolio from "./pages/Portfolio";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import VitrinePublic from "./pages/VitrinePublic";
import BlogPublic from "./pages/BlogPublic";
import BlogAdmin from "./pages/BlogAdmin";
import Documents from "./pages/Documents";
import DocumentGenerate from "./pages/DocumentGenerate";
import DocumentTemplates from "./pages/DocumentTemplates";
import LegalAssistant from "./pages/LegalAssistant";
import LegalSources from "./pages/LegalSources";
import PwaRegistration from "./components/common/PwaRegistration";

export default function App() {
  return (
    <AuthProvider>
      <FeatureProvider>
      <LanguageProvider>
      <ConfirmProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="bottom-right" richColors />
        <PwaRegistration />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/vitrine" element={<VitrinePublic />} />
          <Route path="/actualites" element={<BlogPublic />} />
          <Route path="/actualites/:slug" element={<BlogPublic />} />
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
            <Route path="/agenda" element={<FeatureGate feature="placement_agenda"><Agenda /></FeatureGate>} />
            <Route path="/pipeline" element={<FeatureGate feature="placement_pipeline"><Pipeline /></FeatureGate>} />
            <Route path="/commissions" element={<FeatureGate feature="placement_commissions"><Commissions /></FeatureGate>} />
            <Route path="/agents" element={<ProtectedRoute requireAdmin><Agents /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute requireAdmin><FeatureGate feature="secu_audit"><AuditLog /></FeatureGate></ProtectedRoute>} />
            <Route path="/rgpd" element={<ProtectedRoute requireAdmin><FeatureGate feature="secu_rgpd"><RgpdRequests /></FeatureGate></ProtectedRoute>} />
            <Route path="/portefeuille" element={<FeatureGate feature="pilotage_portefeuille"><Portfolio /></FeatureGate>} />
            <Route path="/rapports" element={<ProtectedRoute requireAdmin><FeatureGate feature="pilotage_rapports"><Reports /></FeatureGate></ProtectedRoute>} />
            <Route path="/blog" element={<ProtectedRoute requireAdmin><FeatureGate feature="vitrine_blog"><BlogAdmin /></FeatureGate></ProtectedRoute>} />
            <Route path="/documents" element={<FeatureGate feature="media_generateur_documents"><Documents /></FeatureGate>} />
            <Route path="/documents/nouveau" element={<FeatureGate feature="media_generateur_documents"><DocumentGenerate /></FeatureGate>} />
            <Route path="/documents/modeles" element={<ProtectedRoute requireAdmin><FeatureGate feature="media_generateur_documents"><DocumentTemplates /></FeatureGate></ProtectedRoute>} />
            <Route path="/assistant-juridique" element={<FeatureGate feature="data_assistant_juridique"><LegalAssistant /></FeatureGate>} />
            <Route path="/assistant-juridique/sources" element={<ProtectedRoute requireAdmin><FeatureGate feature="data_assistant_juridique"><LegalSources /></FeatureGate></ProtectedRoute>} />
            <Route path="/features" element={<ProtectedRoute requireAdmin><OwnerRoute><Features /></OwnerRoute></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
      </LanguageProvider>
      </FeatureProvider>
    </AuthProvider>
  );
}
