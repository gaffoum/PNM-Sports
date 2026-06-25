// Fonction serverless Vercel : reçoit le formulaire de contact de la landing
// page (hébergée sur GitHub Pages) et envoie l'e-mail via l'API Resend.
//
// Appel cross-origin : la landing fait un POST vers
//   https://pnm-sports.vercel.app/api/contact
//
// Variables d'environnement (à définir dans le projet Vercel) :
//   RESEND_API_KEY   (obligatoire) — clé API Resend
//   CONTACT_TO       (optionnel)   — destinataire, défaut: contact@pnmsport.com
//   CONTACT_FROM     (optionnel)   — expéditeur sur le domaine vérifié,
//                                    défaut: "PNM Sports <contact@pnmsport.com>"
//   ALLOWED_ORIGINS  (optionnel)   — origines autorisées (séparées par des virgules),
//                                    défaut: https://gaffoum.github.io

const DEFAULT_ORIGINS = "https://gaffoum.github.io";

export default async function handler(req, res) {
  // --- CORS ---
  const allowed = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  // --- Corps de la requête ---
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const nom = (body?.nom || "").toString().trim();
  const email = (body?.email || "").toString().trim();
  const message = (body?.message || "").toString().trim();

  if (!nom || !email || !message) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Service e-mail non configuré." });
  }

  const FROM = process.env.CONTACT_FROM || "PNM Sports <contact@pnmsport.com>";
  const TO = process.env.CONTACT_TO || "contact@pnmsport.com";

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Nouveau message du site — ${nom}`,
        text:
          `Nom    : ${nom}\n` +
          `Email  : ${email}\n` +
          `\n` +
          `Message :\n${message}\n`,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => "");
      console.error("Resend error", resendRes.status, detail);
      return res.status(502).json({ error: "Échec de l'envoi de l'e-mail." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact handler error", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
