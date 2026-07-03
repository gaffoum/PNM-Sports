// Edge Function : admin-delete-agent
// Supprime un agent/admin (utilisateur auth + fiche agent par cascade FK).
//
// Règle : seul un administrateur peut supprimer. Le compte propriétaire
// (agents.is_owner = true) ne peut être supprimé QUE par lui-même.
//
// La suppression de l'utilisateur auth déclenche en cascade :
//   - suppression de la fiche public.agents (FK on delete cascade)
//   - players.agent_referent -> null, activity_log.agent_id -> null, etc.
//
// Déploiement : supabase functions deploy admin-delete-agent
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Vérifier que l'appelant est authentifié et admin
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("agents").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);

    const { id } = await req.json();
    if (!id) return json({ error: "Identifiant de l'agent requis" }, 400);

    // 2) Charger la cible (côté serveur, on ne fait pas confiance au client)
    const { data: target } = await admin.from("agents").select("id, is_owner").eq("id", id).maybeSingle();
    if (!target) return json({ error: "Agent introuvable" }, 404);

    // 3) Règle : le compte propriétaire n'est supprimable que par lui-même
    if (target.is_owner && user.id !== id) {
      return json({ error: "Le compte propriétaire ne peut être supprimé que par lui-même." }, 403);
    }

    // 4) Suppression de l'utilisateur auth (cascade sur public.agents)
    const { error: derr } = await admin.auth.admin.deleteUser(id);
    if (derr) return json({ error: derr.message }, 400);

    // Filet de sécurité : si la fiche agent subsiste (pas de cascade), on la retire.
    await admin.from("agents").delete().eq("id", id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
