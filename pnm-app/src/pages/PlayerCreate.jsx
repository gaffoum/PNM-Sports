import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PlayerForm from "../components/players/PlayerForm";
import { useAuth } from "../hooks/useAuth";
import { logActivity } from "../lib/logActivity";

export default function PlayerCreate() {
  const nav = useNavigate();
  const { agent } = useAuth();
  return (
    <div className="space-y-4">
      <button onClick={() => nav("/players")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Liste</button>
      <h1 className="text-2xl">Nouvelle fiche</h1>
      <PlayerForm
        onCancel={() => nav("/players")}
        onSaved={(p) => {
          logActivity(agent.id, p.id, "create_player");
          toast.success("Fiche créée");
          nav(`/players/${p.id}`);
        }}
      />
    </div>
  );
}
