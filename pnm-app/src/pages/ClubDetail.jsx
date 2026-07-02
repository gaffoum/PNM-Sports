import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Phone, Mail, MessageSquarePlus, Users, Pencil, Check, X } from "lucide-react";
import {
  getClubByNom, updateClub, deleteClub,
  getClubContacts, getClubActivity, getClubPlayers,
  addClubContact, deleteClubContact, addClubActivity, updateClubActivity,
} from "../hooks/useClubs";
import { listNeedsByClub, createNeed, updateNeed, deleteNeed } from "../hooks/useClubNeeds";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";
import { stepLabel, stepBadgeClass } from "../lib/recruitment";
import { statutLabel, statutBadgeClass } from "../lib/clubNeeds";
import { COUNTRIES } from "../lib/countries";
import AutocompleteInput from "../components/common/AutocompleteInput";
import ClubNeedForm from "../components/clubs/ClubNeedForm";

const EMPTY_CONTACT = { nom: "", role: "", telephone: "", email: "" };
const EMPTY_NEED = { poste: "", criteres: [], description: "", statut: "ouvert" };

export default function ClubDetail() {
  const { club: clubParam } = useParams();
  const clubNom = decodeURIComponent(clubParam);
  const nav = useNavigate();
  const { agent, isAdmin, can } = useAuth();
  const { hasFeature } = useFeatures();
  const confirm = useConfirm();
  const canEdit = isAdmin || can("edit_players");
  const hasNeeds = hasFeature("placement_besoins_clubs");

  const [club, setClub] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [players, setPlayers] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddNeed, setShowAddNeed] = useState(false);
  const [needForm, setNeedForm] = useState(EMPTY_NEED);
  const [creatingNeed, setCreatingNeed] = useState(false);
  const [editingNeedId, setEditingNeedId] = useState(null);
  const [editNeedForm, setEditNeedForm] = useState(EMPTY_NEED);
  const [savingNeed, setSavingNeed] = useState(false);

  const [editingClub, setEditingClub] = useState(false);
  const [clubForm, setClubForm] = useState({ nom: "", pays: "" });

  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [savingContact, setSavingContact] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  async function load() {
    setLoading(true);
    try {
      const c = await getClubByNom(clubNom);
      if (!c) { toast.error("Club introuvable."); nav("/clubs"); return; }
      setClub(c);
      setClubForm({ nom: c.nom, pays: c.pays || "" });
      const [contactsData, activityData, playersData, needsData] = await Promise.all([
        getClubContacts(c.id), getClubActivity(c.id), getClubPlayers(c.nom),
        hasNeeds ? listNeedsByClub(c.id) : Promise.resolve([]),
      ]);
      setContacts(contactsData); setActivity(activityData); setPlayers(playersData); setNeeds(needsData);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [clubNom, hasNeeds]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveClub() {
    if (!clubForm.nom.trim()) return toast.error("Le nom du club est requis.");
    try {
      const updated = await updateClub(club.id, { nom: clubForm.nom.trim(), pays: clubForm.pays.trim() });
      setClub(updated);
      setEditingClub(false);
      toast.success("Club mis à jour");
      if (updated.nom !== clubNom) nav(`/clubs/${encodeURIComponent(updated.nom)}`, { replace: true });
    } catch (e) {
      if (e.code === "23505") toast.error("Un club porte déjà ce nom.");
      else toast.error(e.message);
    }
  }

  async function removeClub() {
    const ok = await confirm({
      title: "Supprimer ce club ?",
      message: `${club.nom}\nSes contacts et son historique d'échanges seront supprimés.\nLes joueurs déjà associés à ce club ne sont pas modifiés.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteClub(club.id);
      toast.success("Club supprimé");
      nav("/clubs");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function submitContact(e) {
    e.preventDefault();
    if (!contactForm.nom.trim()) return toast.error("Le nom du contact est requis.");
    setSavingContact(true);
    try {
      const created = await addClubContact({ club_id: club.id, ...contactForm, created_by: agent.id });
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
      const created = await addClubActivity({ club_id: club.id, note: note.trim(), agent_id: agent.id });
      setActivity((as) => [created, ...as]);
      setNote("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingNote(false);
    }
  }

  function startEditNote(a) {
    setEditingNoteId(a.id);
    setEditingNoteText(a.note);
  }

  async function saveNote(a) {
    if (!editingNoteText.trim()) return toast.error("La note ne peut pas être vide.");
    try {
      const updated = await updateClubActivity(a.id, editingNoteText.trim());
      setActivity((as) => as.map((x) => (x.id === a.id ? updated : x)));
      setEditingNoteId(null);
      toast.success("Note modifiée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function submitCreateNeed(e) {
    e.preventDefault();
    setCreatingNeed(true);
    try {
      const created = await createNeed({
        club_id: club.id,
        poste: needForm.poste.trim() || null,
        criteres: needForm.criteres,
        description: needForm.description.trim() || null,
        statut: needForm.statut,
        agent_id: agent.id,
      });
      setNeeds((ns) => [created, ...ns]);
      setNeedForm(EMPTY_NEED);
      setShowAddNeed(false);
      toast.success("Besoin ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreatingNeed(false);
    }
  }

  function startEditNeed(n) {
    setEditingNeedId(n.id);
    setEditNeedForm({ poste: n.poste ?? "", criteres: n.criteres ?? [], description: n.description ?? "", statut: n.statut });
  }

  async function submitEditNeed(e) {
    e.preventDefault();
    setSavingNeed(true);
    try {
      const updated = await updateNeed(editingNeedId, {
        poste: editNeedForm.poste.trim() || null,
        criteres: editNeedForm.criteres,
        description: editNeedForm.description.trim() || null,
        statut: editNeedForm.statut,
      });
      setNeeds((ns) => ns.map((n) => (n.id === editingNeedId ? updated : n)));
      setEditingNeedId(null);
      toast.success("Besoin mis à jour");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingNeed(false);
    }
  }

  async function removeNeed(n) {
    const ok = await confirm({
      title: "Supprimer ce besoin ?",
      message: n.poste || "Besoin sans poste précisé",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteNeed(n.id);
      setNeeds((ns) => ns.filter((x) => x.id !== n.id));
      toast.success("Besoin supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="text-ink-dim">Chargement…</div>;
  if (!club) return null;

  return (
    <div className="space-y-6">
      <button onClick={() => nav("/clubs")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Clubs</button>

      <header className="flex items-start justify-between flex-wrap gap-3">
        {editingClub ? (
          <div className="flex flex-wrap items-center gap-2">
            <input className="input w-64" value={clubForm.nom} onChange={(e) => setClubForm({ ...clubForm, nom: e.target.value })} />
            <AutocompleteInput
              className="w-48"
              placeholder="Pays"
              options={COUNTRIES}
              value={clubForm.pays}
              onChange={(v) => setClubForm({ ...clubForm, pays: v })}
            />
            <button onClick={saveClub} className="btn btn-primary px-3"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditingClub(false)} className="btn btn-ghost px-3"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl">{club.nom}</h1>
            <p className="text-ink-dim text-sm">{club.pays || "Pays non renseigné"} · Contacts, historique et joueurs PNM.</p>
          </div>
        )}
        {canEdit && !editingClub && (
          <div className="flex gap-2">
            <button onClick={() => setEditingClub(true)} className="btn btn-outline px-3"><Pencil className="w-4 h-4" />Modifier</button>
            <button onClick={removeClub} className="btn btn-danger px-3"><Trash2 className="w-4 h-4" />Supprimer</button>
          </div>
        )}
      </header>

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
                {editingNoteId === a.id ? (
                  <div className="space-y-2">
                    <textarea className="input min-h-[60px]" value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => saveNote(a)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingNoteId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap">{a.note}</p>
                      {canEdit && (
                        <button onClick={() => startEditNote(a)} className="btn btn-ghost p-1.5 shrink-0" title="Modifier">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-1">
                      {a.agent ? `${a.agent.prenom} ${a.agent.nom}` : "—"} · {formatDateFr(a.created_at)}
                      {a.updated_at && <> · modifiée le {formatDateFr(a.updated_at)}</>}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Besoins du club */}
        {hasNeeds && (
          <div className="panel p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Besoins du club</h3>
              {canEdit && !showAddNeed && (
                <button onClick={() => setShowAddNeed(true)} className="btn btn-outline text-xs px-2 py-1">
                  <Plus className="w-3.5 h-3.5" />Ajouter un besoin
                </button>
              )}
            </div>
            {showAddNeed && (
              <div className="bg-bg-1 border border-line rounded-lg p-3">
                <ClubNeedForm
                  form={needForm}
                  setForm={setNeedForm}
                  disableClub
                  submitLabel="Ajouter"
                  onSubmit={submitCreateNeed}
                  onCancel={() => { setShowAddNeed(false); setNeedForm(EMPTY_NEED); }}
                  busy={creatingNeed}
                />
              </div>
            )}
            {needs.length === 0 && <p className="text-sm text-ink-dim">Aucun besoin enregistré pour ce club.</p>}
            <ul className="divide-y divide-line">
              {needs.map((n) => (
                <li key={n.id} className="py-2.5">
                  {editingNeedId === n.id ? (
                    <ClubNeedForm
                      form={editNeedForm}
                      setForm={setEditNeedForm}
                      disableClub
                      submitLabel="Enregistrer"
                      onSubmit={submitEditNeed}
                      onCancel={() => setEditingNeedId(null)}
                      busy={savingNeed}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {n.poste && <span className="text-sm font-medium">{n.poste}</span>}
                          <span className={`badge ${statutBadgeClass(n.statut)}`}>{statutLabel(n.statut)}</span>
                        </div>
                        {n.criteres?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {n.criteres.map((c) => (
                              <span key={c} className="text-[11px] bg-line/30 border border-line rounded-full px-2 py-0.5 text-ink-dim">{c}</span>
                            ))}
                          </div>
                        )}
                        {n.description && <p className="text-sm text-ink-dim whitespace-pre-wrap">{n.description}</p>}
                        <div className="text-[11px] text-ink-muted">{formatDateFr(n.created_at)}</div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditNeed(n)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeNeed(n)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

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
    </div>
  );
}
