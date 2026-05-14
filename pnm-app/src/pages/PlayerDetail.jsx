import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import { Pencil, Trash2, Download, Upload, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import { getPlayerById, getPlayerStats, getPlayerDocuments } from "../hooks/usePlayers";
import { useAuth } from "../hooks/useAuth";
import { calcAge, formatDateFr, formatMoney } from "../lib/utils";
import { logActivity } from "../lib/logActivity";
import PlayerForm from "../components/players/PlayerForm";
import PhotoCropper from "../components/players/PhotoCropper";
import StatsTable from "../components/players/StatsTable";
import DocumentsList from "../components/players/DocumentsList";
import PlayerPdf from "../components/players/PlayerPdf";

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { agent } = useAuth();
  const fileRef = useRef(null);

  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [p, s, d] = await Promise.all([getPlayerById(id), getPlayerStats(id), getPlayerDocuments(id)]);
        if (!active) return;
        setPlayer(p); setStats(s); setDocs(d);
      } catch (e) {
        toast.error(e.message);
        nav("/players");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, nav]);

  function onPickPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setCropSrc(r.result);
    r.readAsDataURL(f);
    e.target.value = "";
  }

  async function onPhotoConfirmed(blob) {
    setCropSrc(null);
    const path = `${player.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from("player-photos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (upErr) { toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("player-photos").getPublicUrl(path);
    const { data, error } = await supabase.from("players").update({ photo_url: pub.publicUrl }).eq("id", player.id).select().single();
    if (error) { toast.error(error.message); return; }
    setPlayer({ ...player, ...data, agent: player.agent });
    toast.success("Photo mise à jour");
    logActivity(agent.id, player.id, "update_photo");
  }

  async function deletePlayer() {
    if (!confirm(`Supprimer définitivement la fiche de ${player.prenom} ${player.nom} ? (droit à l'oubli RGPD)`)) return;
    if (player.photo_url) {
      try {
        const path = decodeURIComponent(new URL(player.photo_url).pathname.split("/player-photos/")[1]);
        if (path) await supabase.storage.from("player-photos").remove([path]);
      } catch { /* ignore */ }
    }
    if (docs.length) {
      await supabase.storage.from("player-documents").remove(docs.map((d) => d.storage_path));
    }
    const { error } = await supabase.from("players").delete().eq("id", player.id);
    if (error) { toast.error(error.message); return; }
    logActivity(agent.id, null, "delete_player", { player_name: `${player.prenom} ${player.nom}` });
    toast.success("Fiche supprimée");
    nav("/players");
  }

  async function exportPdf() {
    setPdfBusy(true);
    try {
      const blob = await pdf(<PlayerPdf player={player} stats={stats} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `pnm-${player.nom}-${player.prenom}.pdf`; a.click();
      URL.revokeObjectURL(url);
      logActivity(agent.id, player.id, "export_pdf");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) return <div className="text-ink-dim">Chargement…</div>;
  if (!player) return null;

  if (editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditing(false)} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Retour à la fiche</button>
        <h1 className="text-2xl">Modifier {player.prenom} {player.nom}</h1>
        <PlayerForm
          player={player}
          onCancel={() => setEditing(false)}
          onSaved={(p) => {
            setPlayer({ ...p, agent: player.agent });
            logActivity(agent.id, p.id, "update_player");
            setEditing(false);
            toast.success("Fiche mise à jour");
          }}
        />
      </div>
    );
  }

  const age = calcAge(player.date_naissance);

  return (
    <div className="space-y-6">
      {cropSrc && <PhotoCropper src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={onPhotoConfirmed} />}

      <button onClick={() => nav("/players")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Liste</button>

      <section className="panel p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="relative">
          {player.photo_url ? (
            <img src={player.photo_url} alt="" className="w-32 h-32 rounded-full object-cover border-2 border-line-strong" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-bg-1 border-2 border-line grid place-items-center font-display text-3xl text-ink-dim">
              {(player.prenom?.[0] ?? "") + (player.nom?.[0] ?? "")}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 p-1.5 bg-cyan text-bg-0 rounded-full border-2 border-bg-0 hover:brightness-110" title="Changer la photo">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl">{player.prenom} {player.nom}</h1>
            <span className={`badge ${player.statut === "joueur" ? "badge-joueur" : "badge-prospect"}`}>{player.statut}</span>
          </div>
          <p className="text-ink-dim mt-1">
            {player.poste ?? "—"} · {player.nationalite ?? "—"} · {age ?? "—"} ans
            {player.club_actuel && <> · {player.club_actuel}</>}
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => setEditing(true)} className="btn btn-outline"><Pencil className="w-4 h-4" />Modifier</button>
            <button onClick={exportPdf} className="btn btn-outline" disabled={pdfBusy}><FileText className="w-4 h-4" />{pdfBusy ? "PDF…" : "Exporter en PDF"}</button>
            <button onClick={deletePlayer} className="btn btn-danger"><Trash2 className="w-4 h-4" />Supprimer</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-3">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Identité</h3>
          <div className="grid grid-cols-2 gap-3">
            <Info label="Naissance" value={formatDateFr(player.date_naissance)} />
            <Info label="Âge" value={age} />
            <Info label="Nationalité" value={player.nationalite} />
            <Info label="Pied fort" value={player.pied_fort} />
            <Info label="Taille" value={player.taille_cm ? `${player.taille_cm} cm` : null} />
            <Info label="Poids" value={player.poids_kg ? `${player.poids_kg} kg` : null} />
          </div>
        </div>
        <div className="panel p-5 space-y-3">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Carrière</h3>
          <div className="grid grid-cols-2 gap-3">
            <Info label="Club actuel" value={player.club_actuel} />
            <Info label="Club précédent" value={player.club_precedent} />
            <Info label="Fin de contrat" value={formatDateFr(player.fin_contrat)} />
            <Info label="Valeur estimée" value={formatMoney(player.valeur_estimee_eur)} />
          </div>
        </div>
        <div className="panel p-5 space-y-3 md:col-span-2">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Contact &amp; agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Info label="Téléphone" value={player.telephone} />
            <Info label="Email" value={player.email} />
            <Info label="Agent référent" value={player.agent ? `${player.agent.prenom} ${player.agent.nom}` : null} />
          </div>
        </div>
      </section>

      <StatsTable playerId={player.id} stats={stats} onChange={setStats} />
      <DocumentsList playerId={player.id} documents={docs} onChange={setDocs} />

      {player.notes && (
        <section className="panel p-5">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright mb-2">Notes internes</h3>
          <pre className="text-sm text-ink whitespace-pre-wrap font-body">{player.notes}</pre>
        </section>
      )}
      <p className="text-[10px] text-ink-muted">
        Consentement RGPD : {player.consentement_rgpd ? `oui (${formatDateFr(player.consentement_rgpd_date)})` : "non renseigné"}
      </p>
    </div>
  );
}
