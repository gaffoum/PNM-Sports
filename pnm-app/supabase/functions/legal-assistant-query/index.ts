// Edge Function : legal-assistant-query
// Brique commerciale « Assistant IA droit du sport » (pack Data & Scouting).
// Recherche plein texte dans legal_chunks (via search_legal_chunks), puis
// demande à l'IA de répondre STRICTEMENT à partir des extraits fournis,
// en citant systématiquement leur référence.
//
// Variables d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (fournisseur principal)
//   GEMINI_API_KEY     (optionnel — repli automatique si Anthropic échoue :
//                        crédit épuisé, timeout, erreur...)
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

async function callAnthropic(system: string, text: string, maxTokens: number, apiKey: string, timeoutMs: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: text }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const isTimeout = (e as Error)?.name === "TimeoutError" || (e as Error)?.name === "AbortError";
    throw new Error(isTimeout ? "délai dépassé" : String((e as Error)?.message ?? e));
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let msg = detail;
    try { msg = JSON.parse(detail)?.error?.message ?? detail; } catch { /* garde le texte brut */ }
    throw new Error(`HTTP ${res.status} — ${msg}`.slice(0, 400));
  }
  const data = await res.json();
  const block = (data.content ?? []).find((b: any) => b.type === "text");
  if (!block) throw new Error("réponse sans contenu texte");
  return block.text;
}

async function callGemini(system: string, text: string, maxTokens: number, apiKey: string, timeoutMs: number): Promise<string> {
  const model = "gemini-1.5-flash";
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const isTimeout = (e as Error)?.name === "TimeoutError" || (e as Error)?.name === "AbortError";
    throw new Error(isTimeout ? "délai dépassé" : String((e as Error)?.message ?? e));
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let msg = detail;
    try { msg = JSON.parse(detail)?.error?.message ?? detail; } catch { /* garde le texte brut */ }
    throw new Error(`HTTP ${res.status} — ${msg}`.slice(0, 400));
  }
  const data = await res.json();
  const t = (data?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  if (!t) throw new Error("réponse sans contenu texte");
  return t;
}

async function callAI(system: string, text: string, maxTokens: number): Promise<{ text: string; provider: string }> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const errors: string[] = [];

  if (anthropicKey) {
    try {
      return { text: await callAnthropic(system, text, maxTokens, anthropicKey, 50_000), provider: "anthropic" };
    } catch (e) {
      console.error("Anthropic failed:", e);
      errors.push(`Anthropic — ${(e as Error).message}`);
    }
  }
  if (geminiKey) {
    try {
      return { text: await callGemini(system, text, maxTokens, geminiKey, 50_000), provider: "gemini" };
    } catch (e) {
      console.error("Gemini failed:", e);
      errors.push(`Gemini — ${(e as Error).message}`);
    }
  }
  throw new Error(errors.length ? errors.join(" | ") : "Aucun fournisseur IA configuré (ANTHROPIC_API_KEY / GEMINI_API_KEY manquants).");
}

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

    const context = chunks
      .map((c: any, i: number) => `[Extrait ${i + 1} — ${c.source_titre}${c.reference ? `, ${c.reference}` : ""}]\n${c.contenu}`)
      .join("\n\n");

    let result;
    try {
      result = await callAI(SYSTEM_PROMPT, `Extraits disponibles :\n\n${context}\n\nQuestion de l'agent : ${question}`, 2048);
    } catch (e) {
      return json({ error: `Échec de la génération de la réponse. ${(e as Error).message}`.slice(0, 500) }, 502);
    }

    const sources = chunks.map((c: any) => ({ id: c.id, titre: c.source_titre, reference: c.reference, categorie: c.source_categorie }));

    return json({ reponse: result.text, sources, provider: result.provider });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
