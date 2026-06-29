// Edge Function : admin-create-agent
// Crée un agent (utilisateur) — réservé aux administrateurs — et lui envoie
// un e-mail d'invitation AU FORMAT PNM (via Resend) pour définir son mot de passe.
//
// Déploiement :
//   supabase functions deploy admin-create-agent
// Secrets requis (en plus des SUPABASE_* fournis automatiquement) :
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set APP_URL=https://pnm-sports.vercel.app        (optionnel)
//   supabase secrets set MAIL_FROM="PNM Sports <contact@pnmsport.com>" (optionnel)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function inviteEmailHtml(prenom: string, link: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#04101f;font-family:Arial,Helvetica,sans-serif;color:#e6f2fb">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04101f;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a2540;border-radius:14px;overflow:hidden;border:1px solid #163a57">
        <tr><td style="background:#0a2540;padding:24px 32px;border-bottom:1px solid #163a57">
          <span style="font-size:18px;font-weight:bold;letter-spacing:3px;color:#ffffff">PNM SPORTS</span>
          <span style="font-size:10px;letter-spacing:3px;color:#7ce3ff;display:block;margin-top:4px">ESPACE AGENTS</span>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="font-size:20px;color:#ffffff;margin:0 0 12px">Bienvenue${prenom ? ", " + prenom : ""} 👋</h1>
          <p style="font-size:14px;line-height:1.6;color:#9fc3d8;margin:0 0 24px">
            Un compte agent vient d'être créé pour vous sur l'espace PNM Sports.
            Cliquez sur le bouton ci-dessous pour <strong style="color:#e6f2fb">définir votre mot de passe</strong> et accéder à votre espace.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:#1ab8e0">
            <a href="${link}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:bold;color:#04101f;text-decoration:none;border-radius:999px">
              Définir mon mot de passe
            </a>
          </td></tr></table>
          <p style="font-size:12px;line-height:1.6;color:#557d99;margin:24px 0 0">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
            <a href="${link}" style="color:#7ce3ff;word-break:break-all">${link}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #163a57;font-size:11px;color:#557d99">
          PNM Sports — Espace agents · E-mail automatique, merci de ne pas répondre.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://pnm-sports.vercel.app";
    const mailFrom = Deno.env.get("MAIL_FROM") ?? "PNM Sports <contact@pnmsport.com>";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // 1) Vérifier que l'appelant est admin
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("agents").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "Réservé aux administrateurs" }, 403);

    const { prenom, nom, email, role } = await req.json();
    if (!email || !prenom || !nom) return json({ error: "Champs requis manquants" }, 400);

    // 2) Créer l'utilisateur (sans envoyer l'e-mail Supabase par défaut)
    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { prenom, nom },
    });
    if (cerr) return json({ error: cerr.message }, 400);

    // 3) Fiche agent
    const { error: insErr } = await admin.from("agents").insert({
      id: created.user.id, prenom, nom, email, role: role === "admin" ? "admin" : "agent",
    });
    if (insErr) return json({ error: insErr.message }, 400);

    // 4) Lien de définition du mot de passe
    const { data: linkData, error: lerr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${appUrl}/reset-password` },
    });
    if (lerr) return json({ error: lerr.message }, 400);
    const actionLink = linkData.properties?.action_link;

    // 5) Envoi de l'e-mail PNM via Resend
    if (resendKey && actionLink) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: mailFrom,
          to: [email],
          subject: "Votre accès à l'espace agents PNM Sports",
          html: inviteEmailHtml(prenom, actionLink),
        }),
      });
      if (!r.ok) return json({ ok: true, warning: "Agent créé mais e-mail non envoyé (Resend)." });
    }

    return json({ ok: true, id: created.user.id, emailed: !!(resendKey && actionLink) });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
