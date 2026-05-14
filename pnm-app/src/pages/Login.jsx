import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) nav("/dashboard", { replace: true });
  }, [isAuthenticated, loading, nav]);

  return (
    <div className="min-h-screen relative grid place-items-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(900px 500px at 20% 10%, rgba(26,184,224,0.18), transparent), radial-gradient(700px 500px at 90% 90%, rgba(15,59,82,0.5), transparent)",
        }}
      />
      <LoginForm />
    </div>
  );
}
