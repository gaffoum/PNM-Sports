// Edge Function : send-notification-email
// Brique commerciale « Emails automatiques » (pack Communication).
// Envoie un e-mail transactionnel simple (sujet + texte) via Resend, pour
// prévenir un agent d'un événement (nouveau rendez-vous, deal signé, etc.)
// quand il n'est pas connecté pour voir sa notification in-app.
//
// Variable d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   RESEND_API_KEY  (obligatoire, déjà utilisé par send-player-pdf)
//   CONTACT_FROM    (optionnel, défaut "PNM Sports <contact@pnmsport.com>")
//
// Déploiement : supabase functions deploy send-notification-email
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const { to, subject, text } = await req.json();
    if (!to || !subject || !text) return json({ error: "Champs requis manquants" }, 400);
    if (!EMAIL_RE.test(String(to))) return json({ error: "Adresse e-mail invalide" }, 400);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return json({ error: "Service e-mail non configuré (RESEND_API_KEY manquant)." }, 500);

    const FROM = Deno.env.get("CONTACT_FROM") || "PNM Sports <contact@pnmsport.com>";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject: String(subject), text: String(text) }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => "");
      console.error("Resend error", resendRes.status, detail);
      return json({ error: "Échec de l'envoi de l'e-mail." }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
