// Edge Function : extract-document-clauses
// Brique commerciale « Envoi de fiche PDF par email » / générateur de
// documents. Reçoit un PDF déjà rédigé (mandat/contrat) en base64 et
// demande à l'IA de le restructurer en paragraphes titrés avec variables
// {{...}} repérées, pour alimenter un modèle de document.
//
// Variables d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (fournisseur principal)
//   GEMINI_API_KEY     (optionnel — repli automatique si Anthropic échoue :
//                        crédit épuisé, timeout, erreur...)
//
// Déploiement : supabase functions deploy extract-document-clauses
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM_PROMPT = `Tu reçois un document déjà rédigé (mandat de représentation ou contrat de travail joueur).
Tu dois :
1. Extraire l'intégralité du texte utile du document.
2. Le restructurer en une liste de paragraphes cohérents, chacun avec un titre court (ex : "Objet", "Durée", "Rémunération", "Résiliation"...).
3. Repérer les informations spécifiques à ce document (nom du joueur, nom du club, dates, montants, durées, nationalité...)
   et les remplacer dans le texte par des variables au format {{joueur.nom}}, {{joueur.prenom}}, {{club.nom}},
   {{champ.<nom_variable>}} (nom de variable en minuscules avec underscores, ex: {{champ.salaire_annuel}}).
4. Améliorer légèrement la clarté et le style juridique du texte si nécessaire, SANS changer le sens ni ajouter de clauses.
5. Pour chaque variable {{champ.xxx}} que tu introduis (hors joueur/club déjà couverts), propose un champ de formulaire
   correspondant (clé, libellé, type parmi text/textarea/number/date).

Réponds UNIQUEMENT avec un objet JSON valide de cette forme, sans texte autour :
{"paragraphes": [{"titre": "...", "contenu": "..."}], "champs_suggeres": [{"cle": "...", "label": "...", "type": "text"}]}`;

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

// Essaie Anthropic (fournisseur principal), puis bascule sur Gemini si
// configuré et qu'Anthropic échoue (crédit épuisé, timeout, erreur...).
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
      result = await callAI(SYSTEM_PROMPT, "Analyse ce document et renvoie le JSON demandé.", pdfBase64, 4096);
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

    return json({ paragraphes: parsed.paragraphes ?? [], champs_suggeres: parsed.champs_suggeres ?? [], provider: result.provider });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
