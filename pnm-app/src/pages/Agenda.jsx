import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, CalendarClock, MapPin } from "lucide-react";
import { listAllAppointments, updateAppointment, deleteAppointment } from "../hooks/useAppointments";
import { useConfirm } from "../contexts/ConfirmContext";
import { APPOINTMENT_STATUTS, appointmentStatutLabel, appointmentStatutBadgeClass } from "../lib/appointments";

function formatRdv(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Agenda() {
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("a_venir");

  async function load() {
    setLoading(true);
    try {
      setAppointments(await listAllAppointments());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeStatut(a, statut) {
    try {
      const updated = await updateAppointment(a.id, { statut });
      setAppointments((as) => as.map((x) => (x.id === a.id ? updated : x)));
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(a) {
    const ok = await confirm({ title: "Supprimer ce rendez-vous ?", message: a.titre, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteAppointment(a.id);
      setAppointments((as) => as.filter((x) => x.id !== a.id));
      toast.success("Rendez-vous supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const filtered = appointments.filter((a) => !filterStatut || a.statut === filterStatut);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Agenda</h1>
        <p className="text-ink-dim text-sm">Tous les rendez-vous, toutes fiches confondues. La création se fait depuis la fiche du joueur.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilterStatut("")} className={`btn ${!filterStatut ? "btn-primary" : "btn-outline"}`}>Tous</button>
        {APPOINTMENT_STATUTS.map((s) => (
          <button key={s.key} onClick={() => setFilterStatut(s.key)} className={`btn ${filterStatut === s.key ? "btn-primary" : "btn-outline"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="panel divide-y divide-line">
          {filtered.length === 0 && <p className="text-ink-dim p-5">Aucun rendez-vous.</p>}
          {filtered.map((a) => (
            <div key={a.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.player ? (
                    <Link to={`/players/${a.player.id}`} className="font-semibold hover:text-cyan-bright">
                      {a.player.prenom} {a.player.nom}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink-dim">Joueur supprimé</span>
                  )}
                  <span className="text-ink-dim text-sm">— {a.titre}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-1">
                  <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{formatRdv(a.date_rdv)}</span>
                  {a.lieu && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.lieu}</span>}
                </div>
                {a.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap mt-1">{a.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  className="input w-auto py-1.5"
                  value={a.statut}
                  onChange={(e) => changeStatut(a, e.target.value)}
                >
                  {APPOINTMENT_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <span className={`badge ${appointmentStatutBadgeClass(a.statut)}`}>{appointmentStatutLabel(a.statut)}</span>
                <button onClick={() => remove(a)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
