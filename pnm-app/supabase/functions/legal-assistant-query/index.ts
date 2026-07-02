// Edge Function : legal-assistant-query
// Brique commerciale « Assistant IA droit du sport » (pack Data & Scouting).
// Recherche plein texte dans legal_chunks (via search_legal_chunks), puis
// demande a Claude de repondre STRICTEMENT a partir des extraits fournis,
// en citant systematiquement leur reference.
//
// Variable d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (déjà requis pour le générateur de documents)
//
// Déploiement : supabase functions deploy legal-assistant-query
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM_PROMPT = `Tu es un assistant d'information juridique specialise en droit du sport (football francais et
international), au service d'agents sportifs. Des extraits de reglements/textes juridiques pertinents te sont fournis
pour chaque question.

Regles strictes :
1. Réponds UNIQUEMENT à partir des extraits fournis. N'invente jamais une règle, un article ou un montant.
2. Cite systématiquement la référence exacte de chaque extrait utilisé (ex : "RSTP art. 17.1", "Code du sport art. L222-7").
3. Si les extraits fournis ne permettent pas de répondre complètement, dis-le explicitement plutôt que de combler les
   lacunes avec des connaissances générales.
4. Termine toujours ta réponse par ce rappel exact : "Cette réponse est informative et ne remplace pas l'avis d'un
   avocat spécialisé en droit du sport."
5. Réponds en français, de façon claire et structurée.`;

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

    const { question } = await req.json();
    if (!question || !String(question).trim()) return json({ error: "Question requise" }, 400);

    const { data: chunks, error: searchErr } = await caller.rpc("search_legal_chunks", {
      p_query: question,
      p_limit: 8,
    });
    if (searchErr) {
      console.error("search_legal_chunks error", searchErr);
      return json({ error: "Échec de la recherche documentaire." }, 500);
    }

    if (!chunks || chunks.length === 0) {
      return json({
        reponse: "Aucun extrait pertinent n'a été trouvé dans la base documentaire pour cette question. La base est peut-être incomplète sur ce sujet — vérifie /assistant-juridique/sources.\n\nCette réponse est informative et ne remplace pas l'avis d'un avocat spécialisé en droit du sport.",
        sources: [],
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "Service IA non configuré (ANTHROPIC_API_KEY manquant)." }, 500);

    const context = chunks
      .map((c: any, i: number) => `[Extrait ${i + 1} — ${c.source_titre}${c.reference ? `, ${c.reference}` : ""}]\n${c.contenu}`)
      .join("\n\n");

    let claudeRes: Response;
    try {
      claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: `Extraits disponibles :\n\n${context}\n\nQuestion de l'agent : ${question}` },
          ],
        }),
        signal: AbortSignal.timeout(50_000),
      });
    } catch (fetchErr) {
      const isTimeout = (fetchErr as Error)?.name === "TimeoutError" || (fetchErr as Error)?.name === "AbortError";
      return json({
        error: isTimeout
          ? "La génération de la réponse a dépassé le délai autorisé (50s). Réessaie."
          : `Échec de l'appel à l'IA : ${String((fetchErr as Error)?.message ?? fetchErr)}`,
      }, isTimeout ? 504 : 502);
    }

    if (!claudeRes.ok) {
      const detail = await claudeRes.text().catch(() => "");
      console.error("Anthropic error", claudeRes.status, detail);
      let detailMsg = detail;
      try { detailMsg = JSON.parse(detail)?.error?.message ?? detail; } catch { /* garde le texte brut */ }
      return json({ error: `Échec de la génération de la réponse (Claude ${claudeRes.status}) : ${detailMsg}`.slice(0, 500) }, 502);
    }

    const claudeData = await claudeRes.json();
    const textBlock = (claudeData.content ?? []).find((b: any) => b.type === "text");
    const reponse = textBlock?.text ?? "Réponse indisponible.";

    const sources = chunks.map((c: any) => ({ id: c.id, titre: c.source_titre, reference: c.reference, categorie: c.source_categorie }));

    return json({ reponse, sources });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
