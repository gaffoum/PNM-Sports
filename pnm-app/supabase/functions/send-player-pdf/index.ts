// Edge Function : send-player-pdf
// Brique commerciale « Envoi de fiche PDF par email » (pack Communication /
// Quick Wins). Reçoit un PDF déjà généré côté client (en base64) et l'envoie
// en pièce jointe via Resend.
//
// Variables d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   RESEND_API_KEY  (obligatoire)
//   CONTACT_FROM    (obligatoire — ex. "Mon Agence <contact@mon-domaine.com>",
//                    doit correspondre à un domaine vérifié sur Resend)
//
// Déploiement : supabase functions deploy send-player-pdf
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

    // Authentification : tout agent connecté peut envoyer une fiche.
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await caller.auth.getUser();
    if (uerr || !user) return json({ error: "Non authentifié" }, 401);

    const { to, playerName, pdfBase64 } = await req.json();
    if (!to || !pdfBase64) return json({ error: "Champs requis manquants" }, 400);
    if (!EMAIL_RE.test(String(to))) return json({ error: "Adresse e-mail invalide" }, 400);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return json({ error: "Service e-mail non configuré (RESEND_API_KEY manquant)." }, 500);

    const FROM = Deno.env.get("CONTACT_FROM");
    if (!FROM) return json({ error: "Service e-mail non configuré (CONTACT_FROM manquant)." }, 500);
    const safeName = String(playerName || "joueur").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-");
    const filename = `fiche-${safeName}.pdf`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: `Fiche joueur — ${playerName || ""}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint la fiche de ${playerName || "ce joueur"}.`,
        attachments: [{ filename, content: pdfBase64 }],
      }),
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
