// Edge Function : admin-create-agent
// Crée un agent (utilisateur) avec un mot de passe initial défini par l'admin.
// PAS d'e-mail : l'agent se connecte avec ce mot de passe, et il lui est
// demandé de le changer à la première connexion (flag must_change_password).
//
// Déploiement : supabase functions deploy admin-create-agent
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY sont fournis
//  automatiquement par Supabase.)
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

    // 1) Vérifier que l'appelant est admin
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("agents").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);

    const { prenom, nom, email, role, password } = await req.json();
    if (!email || !prenom || !nom) return json({ error: "Champs requis manquants" }, 400);
    if (!password || String(password).length < 8) {
      return json({ error: "Mot de passe initial requis (8 caractères minimum)" }, 400);
    }

    // 2) Créer l'utilisateur avec le mot de passe initial (e-mail confirmé,
    //    aucun e-mail envoyé), marqué "doit changer son mot de passe".
    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { prenom, nom, must_change_password: true },
    });
    if (cerr) return json({ error: cerr.message }, 400);

    // 3) Fiche agent
    const { error: insErr } = await admin.from("agents").insert({
      id: created.user.id, prenom, nom, email, role: role === "admin" ? "admin" : "agent",
    });
    if (insErr) return json({ error: insErr.message }, 400);

    return json({ ok: true, id: created.user.id });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
