// Edge Function : extract-document-clauses
// Brique commerciale « Générateur de documents » (pack Documents & média).
// Reçoit un PDF existant (mandat/contrat déjà rédigé) en base64, l'envoie
// à l'API Claude (Anthropic) pour en extraire le contenu, le restructurer
// en paragraphes titrés et repérer les informations variables (nom du
// joueur, du club, montants, dates...) à remplacer par des {{variables}}.
//
// Variable d'environnement à définir (Supabase → Project Settings → Edge
// Functions → Secrets) :
//   ANTHROPIC_API_KEY  (obligatoire — nouvelle dépendance, à souscrire)
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

const SYSTEM_PROMPT = `Tu es un assistant juridique pour une agence sportive. On te fournit un document
(mandat de représentation ou contrat de travail joueur) déjà rédigé. Tu dois :
1. Extraire l'intégralité du texte utile du document.
2. Le restructurer en une liste de paragraphes cohérents, chacun avec un titre court (ex : "Objet", "Durée", "Rémunération", "Résiliation"...).
3. Repérer les informations spécifiques à ce document (nom du joueur, nom du club, dates, montants, durées, nationalité...)
   et les remplacer dans le texte par des variables au format {{joueur.nom}}, {{joueur.prenom}}, {{club.nom}},
   {{champ.<nom_variable>}} (utilise un nom de variable en minuscules avec underscores, ex: {{champ.salaire_annuel}}).
4. Améliorer légèrement la clarté et le style juridique du texte si nécessaire, SANS changer le sens ni ajouter de clauses.
5. Pour chaque variable {{champ.xxx}} que tu introduis (hors joueur/club déjà couverts), propose un champ de formulaire
   correspondant (clé, libellé, type parmi text/textarea/number/date).

Réponds UNIQUEMENT avec un objet JSON valide de cette forme, sans texte autour :
{"paragraphes": [{"titre": "...", "contenu": "..."}], "champs_suggeres": [{"cle": "...", "label": "...", "type": "text"}]}`;

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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
              { type: "text", text: "Analyse ce document et renvoie le JSON demandé." },
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

    return json({ paragraphes: parsed.paragraphes ?? [], champs_suggeres: parsed.champs_suggeres ?? [] });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
