// Edge Function : extract-legal-chunks
// Brique commerciale « Assistant IA droit du sport » (pack Data & Scouting).
// Reçoit un PDF (règlement, texte de loi...) en base64 et demande à l'IA de
// le découper en extraits citables (référence + contenu), pour alimenter la
// base documentaire (legal_chunks) utilisée par l'assistant.
//
// Variables d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (fournisseur principal)
//   GEMINI_API_KEY     (optionnel — repli automatique si Anthropic échoue :
//                        crédit épuisé, timeout, erreur...)
//
// Note : l'API Claude limite un document à 600 pages par requête ; au-delà,
// scinde le PDF en plusieurs fichiers avant import.
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

async function callAnthropic(system: string, text: string, pdfBase64: string, maxTokens: number, apiKey: string, timeoutMs: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: maxTokens,
        system,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text },
          ],
        }],
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

async function callGemini(system: string, text: string, pdfBase64: string, maxTokens: number, apiKey: string, timeoutMs: number): Promise<string> {
  const model = "gemini-1.5-flash";
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
            { text },
          ],
        }],
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

async function callAI(system: string, text: string, pdfBase64: string, maxTokens: number): Promise<{ text: string; provider: string }> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const errors: string[] = [];

  if (anthropicKey) {
    try {
      return { text: await callAnthropic(system, text, pdfBase64, maxTokens, anthropicKey, 50_000), provider: "anthropic" };
    } catch (e) {
      console.error("Anthropic failed:", e);
      errors.push(`Anthropic — ${(e as Error).message}`);
    }
  }
  if (geminiKey) {
    try {
      return { text: await callGemini(system, text, pdfBase64, maxTokens, geminiKey, 50_000), provider: "gemini" };
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

    const { pdfBase64 } = await req.json();
    if (!pdfBase64) return json({ error: "Fichier PDF requis" }, 400);

    let result;
    try {
      result = await callAI(SYSTEM_PROMPT, "Découpe ce document en extraits citables et renvoie le JSON demandé.", pdfBase64, 8192);
    } catch (e) {
      return json({ error: `Échec de l'analyse du document. ${(e as Error).message}`.slice(0, 500) }, 502);
    }

    let parsed;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result.text);
    } catch {
      console.error("JSON parse failed, raw text:", result.text);
      return json({ error: `Impossible d'interpréter la réponse de l'IA (${result.provider}). Début : ${result.text.slice(0, 300)}` }, 502);
    }

    return json({ extraits: parsed.extraits ?? [], provider: result.provider });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
