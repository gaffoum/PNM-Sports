// Edge Function : admin-set-password
// Permet à un administrateur de définir un nouveau mot de passe pour
// n'importe quel agent (ex. agent bloqué, mot de passe oublié sans email).
//
// Comme à la création, l'agent devra changer ce mot de passe à sa
// prochaine connexion (flag must_change_password).
//
// Déploiement : supabase functions deploy admin-set-password
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

    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("agents").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);

    const { id, password } = await req.json();
    if (!id) return json({ error: "Identifiant de l'agent requis" }, 400);
    if (!password || String(password).length < 8) {
      return json({ error: "Mot de passe requis (8 caractères minimum)" }, 400);
    }

    const { data: target } = await admin.from("agents").select("id").eq("id", id).maybeSingle();
    if (!target) return json({ error: "Agent introuvable" }, 404);

    const { error: uErr } = await admin.auth.admin.updateUserById(id, {
      password,
      user_metadata: { must_change_password: true },
    });
    if (uErr) return json({ error: uErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
