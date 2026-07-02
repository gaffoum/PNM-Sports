// Edge Function : extract-legal-chunks
// Brique commerciale « Assistant IA droit du sport » (pack Data & Scouting).
// Reçoit un PDF (règlement, texte de loi...) en base64 et demande à Claude
// de le découper en extraits citables (référence + contenu), pour
// alimenter la base documentaire (legal_chunks) utilisée par l'assistant.
//
// Variable d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (déjà requis pour le générateur de documents)
//
// Déploiement : supabase functions deploy extract-legal-chunks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM_PROMPT = `Tu reçois un document juridique/réglementaire (règlement sportif, texte de loi, décision de
jurisprudence...). Découpe-le fidèlement en extraits citables, SANS reformuler ni résumer le contenu (le texte doit
rester exact, il sera cité comme source juridique). Pour chaque extrait :
- "reference" : la référence précise si elle existe (ex : "Article 17.1", "Art. L222-7", "§ 42"), sinon une référence
  descriptive courte (ex : "Préambule", "Section 2 - Définitions").
- "contenu" : le texte exact de cet extrait (un article, un paragraphe numéroté, ou une section cohérente — pas de
  découpage arbitraire au milieu d'une phrase).

Réponds UNIQUEMENT avec un JSON valide de cette forme, sans texte autour :
{"extraits": [{"reference": "...", "contenu": "..."}]}`;

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

    const { pdfBase64 } = await req.json();
    if (!pdfBase64) return json({ error: "Fichier PDF requis" }, 400);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "Service IA non configuré (ANTHROPIC_API_KEY manquant)." }, 500);

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
              { type: "text", text: "Découpe ce document en extraits citables et renvoie le JSON demandé." },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const detail = await claudeRes.text().catch(() => "");
      console.error("Anthropic error", claudeRes.status, detail);
      return json({ error: "Échec de l'analyse du document." }, 502);
    }

    const claudeData = await claudeRes.json();
    const textBlock = (claudeData.content ?? []).find((b: any) => b.type === "text");
    if (!textBlock) return json({ error: "Réponse IA invalide." }, 502);

    let parsed;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      return json({ error: "Impossible d'interpréter la réponse de l'IA." }, 502);
    }

    return json({ extraits: parsed.extraits ?? [] });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
