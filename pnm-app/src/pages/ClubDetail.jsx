import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Phone, Mail, MessageSquarePlus, Users } from "lucide-react";
import {
  getClubContacts, getClubActivity, getClubPlayers,
  addClubContact, deleteClubContact, addClubActivity,
} from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";
import { stepLabel, stepBadgeClass } from "../lib/recruitment";

const EMPTY_CONTACT = { nom: "", role: "", telephone: "", email: "" };

export default function ClubDetail() {
  const { club: clubParam } = useParams();
  const club = decodeURIComponent(clubParam);
  const nav = useNavigate();
  const { agent, isAdmin, can } = useAuth();
  const confirm = useConfirm();
  const canEdit = isAdmin || can("edit_players");

  const [contacts, setContacts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [savingContact, setSavingContact] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, a, p] = await Promise.all([getClubContacts(club), getClubActivity(club), getClubPlayers(club)]);
      setContacts(c); setActivity(a); setPlayers(p);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [club]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitContact(e) {
    e.preventDefault();
    if (!contactForm.nom.trim()) return toast.error("Le nom du contact est requis.");
    setSavingContact(true);
    try {
      const created = await addClubContact({ club, ...contactForm, created_by: agent.id });
      setContacts((cs) => [...cs, created]);
      setContactForm(EMPTY_CONTACT);
      toast.success("Contact ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingContact(false);
    }
  }

  async function removeContact(c) {
    const ok = await confirm({
      title: "Supprimer ce contact ?",
      message: `${c.nom}${c.role ? " — " + c.role : ""}`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteClubContact(c.id);
      setContacts((cs) => cs.filter((x) => x.id !== c.id));
      toast.success("Contact supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function submitNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const created = await addClubActivity({ club, note: note.trim(), agent_id: agent.id });
      setActivity((as) => [created, ...as]);
      setNote("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => nav("/clubs")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Clubs</button>

      <header>
        <h1 className="text-3xl">{club}</h1>
        <p className="text-ink-dim text-sm">Contacts, historique des échanges et joueurs PNM dans ce club.</p>
      </header>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Contacts */}
          <div className="panel p-5 space-y-3">
            <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Contacts</h3>
            {contacts.length === 0 && <p className="text-sm text-ink-dim">Aucun contact enregistré.</p>}
            <ul className="divide-y divide-line">
              {contacts.map((c) => (
                <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.nom}{c.role && <span className="text-ink-dim"> — {c.role}</span>}</div>
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-0.5">
                      {c.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telephone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => removeContact(c)} className="btn btn-ghost p-1.5" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5 text-red-300" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <form onSubmit={submitContact} className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
                <input className="input" placeholder="Nom" value={contactForm.nom} onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })} />
                <input className="input" placeholder="Rôle (ex. directeur sportif)" value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} />
                <input className="input" placeholder="Téléphone" value={contactForm.telephone} onChange={(e) => setContactForm({ ...contactForm, telephone: e.target.value })} />
                <input className="input" type="email" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                <button type="submit" disabled={savingContact} className="btn btn-primary col-span-2 w-fit">
                  <Plus className="w-4 h-4" />{savingContact ? "…" : "Ajouter le contact"}
                </button>
              </form>
            )}
          </div>

          {/* Historique des échanges */}
          <div className="panel p-5 space-y-3">
            <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Historique des échanges</h3>
            {canEdit && (
              <form onSubmit={submitNote} className="flex flex-col gap-2">
                <textarea
                  className="input min-h-[70px]"
                  placeholder="Ajouter une note (appel, mail, rendez-vous…)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button type="submit" disabled={savingNote} className="btn btn-outline w-fit">
                  <MessageSquarePlus className="w-4 h-4" />{savingNote ? "…" : "Ajouter la note"}
                </button>
              </form>
            )}
            {activity.length === 0 && <p className="text-sm text-ink-dim">Aucun échange enregistré.</p>}
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="py-2.5">
                  <p className="text-sm whitespace-pre-wrap">{a.note}</p>
                  <div className="text-[11px] text-ink-muted mt-1">
                    {a.agent ? `${a.agent.prenom} ${a.agent.nom}` : "—"} · {formatDateFr(a.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Joueurs PNM dans ce club */}
          <div className="panel p-5 space-y-3 lg:col-span-2">
            <h3 className="text-sm uppercase tracking-wider text-cyan-bright flex items-center gap-2">
              <Users className="w-4 h-4" />Joueurs PNM dans ce club
            </h3>
            {players.length === 0 && <p className="text-sm text-ink-dim">Aucun joueur de PNM actuellement dans ce club.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {players.map((p) => (
                <Link key={p.id} to={`/players/${p.id}`} className="flex items-center gap-2 p-2.5 rounded-lg border border-line hover:border-line-strong transition-colors">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-bg-1 border border-line grid place-items-center text-[10px] text-ink-muted">
                      {(p.prenom?.[0] ?? "") + (p.nom?.[0] ?? "")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.prenom} {p.nom}</div>
                    <span className={`badge ${stepBadgeClass(p.recruitment_step)}`}>{stepLabel(p.recruitment_step)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
