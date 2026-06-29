// Edge Function : admin-create-agent
// Crée un agent (utilisateur) — réservé aux administrateurs.
// Déploiement : supabase functions deploy admin-create-agent
// (les variables SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//  sont fournies automatiquement par Supabase.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Vérifier que l'appelant est un admin
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("agents").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);

    // 2) Créer l'utilisateur (invitation par e-mail) + la fiche agent
    const { prenom, nom, email, role } = await req.json();
    if (!email || !prenom || !nom) return json({ error: "Champs requis manquants" }, 400);

    const { data: invited, error: ierr } = await admin.auth.admin.inviteUserByEmail(email);
    if (ierr) return json({ error: ierr.message }, 400);

    const { error: insErr } = await admin.from("agents").insert({
      id: invited.user.id,
      prenom,
      nom,
      email,
      role: role === "admin" ? "admin" : "agent",
    });
    if (insErr) return json({ error: insErr.message }, 400);

    return json({ ok: true, id: invited.user.id });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
