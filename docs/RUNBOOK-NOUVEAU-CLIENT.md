# Runbook — provisionner une nouvelle instance client

Document opérationnel interne (pas pour le client). Suit le plan de
templatisation validé le 03/07/2026. Chaque nouveau client (agence de
football) reçoit sa **propre stack isolée** : un repo GitHub, un projet
Supabase, un projet Vercel, un domaine d'envoi Resend — générés depuis ce
même code (`pnm-app/`), reconfigurés uniquement via variables d'environnement
et le fichier `src/config/brand.js`.

Aucune notion de multi-tenant : chaque client = une base de données à lui,
un déploiement à lui. Voir `docs/PNM-Sports-Roadmap-INTERNE.html` pour le
catalogue des briques vendables.

## Prérequis (à faire une seule fois, pas par client)

Secrets/accès centraux, à créer/rassembler avant le premier client :

| Secret | Usage | Statut |
|---|---|---|
| Accès GitHub (org/compte PNM) | créer un repo par client | déjà en place |
| `organization_id` Supabase (org centrale PNM) | créer un projet par client | à confirmer |
| Vercel Personal Access Token (équipe centrale PNM) | créer un projet + env vars par client (l'outil MCP Vercel connecté ne couvre pas la création de projet) | à créer |
| Clé API Resend centrale | domaine d'envoi + `RESEND_API_KEY` par client | à configurer (compte dédié, pas les identifiants personnels) |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` centrales | briques IA (documents, assistant juridique) | à configurer |

Sans ces 4 secrets, les étapes correspondantes ci-dessous repassent en
manuel (dashboard) au lieu d'être scriptées.

## Informations à collecter côté client avant de commencer

- Nom de l'agence (`VITE_BRAND_NAME`), nom légal si différent
- Logo (PNG carré, remplace `pnm-app/public/logo-pnm.png`)
- Couleur de fond principale si le client veut s'écarter du thème par défaut (`VITE_BRAND_THEME_COLOR`, et éventuellement les tokens cyan de `tailwind.config.js` pour un re-thème plus poussé)
- Domaine du client (ex. `moncabinet.com`) et accès à sa zone DNS
- Email de contact (`VITE_BRAND_CONTACT_EMAIL`), utilisé aussi comme `CONTACT_FROM`
- Email + nom du tout premier compte admin (deviendra automatiquement propriétaire — voir étape 2)
- Liste des briques souscrites (packs du devis signé)

## Étape 1 — Créer le repo GitHub

1. Créer un nouveau repo à partir du repo template (`mcp__github__create_repository` si un template GitHub est configuré, sinon dupliquer le contenu de `pnm-app/` — **pas** les fichiers racine `vercel.json`/`scripts/build-vercel.sh`/`manifest.webmanifest`/`sw.js` qui restent propres au déploiement combiné de PNM, cf. décision retenue dans le plan).
2. Vérifier que `pnm-app/.env.example` est bien présent — c'est la checklist de config à remplir aux étapes suivantes.

## Étape 2 — Créer le projet Supabase et amorcer le premier compte

1. `mcp__Supabase__create_project` (nom = nom du client, région au choix, `organization_id` central, `confirm_cost` avant).
2. Attendre `ACTIVE_HEALTHY` (`get_project`).
3. Appliquer le schéma complet : exécuter le contenu de `pnm-app/supabase/schema.sql` (via `execute_sql`/`apply_migration`, ou en local avec `npm run setup` si on préfère la voie CLI — voir `pnm-app/README.md`). Ce script crée aussi le tout premier compte admin à partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NOM`/`ADMIN_PRENOM` **et lui attribue automatiquement `is_owner = true`** puisque c'est le premier agent de la base — utiliser ici l'email réel du client, jamais un compte de test.
4. Récupérer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (`get_project_url`, `get_publishable_keys`) pour l'étape 4.
5. Créer les buckets Storage `player-photos` (public) et `player-documents` (privé) — déjà géré par `npm run setup`, sinon à recréer manuellement.

## Étape 3 — Déployer les 8 Edge Functions

Pour chacune (`mcp__Supabase__deploy_edge_function`, ou `supabase functions deploy <nom>` en CLI) :

`admin-create-agent`, `admin-delete-agent`, `admin-set-password`,
`extract-document-clauses`, `extract-legal-chunks`, `legal-assistant-query`,
`send-notification-email`, `send-player-pdf`.

Puis définir les secrets du projet (Supabase → Project Settings → Edge
Functions → Secrets, ou API équivalente) :

| Secret | Obligatoire pour | Valeur |
|---|---|---|
| `RESEND_API_KEY` | envoi d'email | clé centrale (étape 5) |
| `CONTACT_FROM` | envoi d'email | ex. `"<Nom client> <contact@domaine-client.com>"` — **obligatoire dès que `RESEND_API_KEY` est défini**, sinon les fonctions email renvoient une erreur 500 explicite (pas de repli silencieux) |
| `ANTHROPIC_API_KEY` | générateur de documents, assistant juridique | clé centrale |
| `GEMINI_API_KEY` | repli si Anthropic échoue | clé centrale (optionnel) |

`SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` sont
auto-injectées par Supabase, rien à faire.

## Étape 4 — Créer le projet Vercel

1. Créer le projet (API Vercel via le Personal Access Token central — pas d'outil MCP dédié à la création), connecté au repo GitHub de l'étape 1, racine du projet = `pnm-app/` (utiliser `pnm-app/vercel.json`, topologie standalone — pas le build combiné racine).
2. Variables d'environnement (Production **et** Preview) :

```
VITE_SUPABASE_URL=<étape 2>
VITE_SUPABASE_ANON_KEY=<étape 2>
VITE_BRAND_NAME=<nom du client>
VITE_BRAND_LEGAL_NAME=<nom légal si différent>
VITE_BRAND_DOMAIN=<domaine du client>
VITE_BRAND_CONTACT_EMAIL=<email de contact du client>
VITE_BRAND_THEME_COLOR=<hex, défaut #04101f si non précisé>
```

3. Déployer (`mcp__Vercel__deploy_to_vercel` ou push sur la branche liée).
4. Remplacer `pnm-app/public/logo-pnm.png` par le logo du client avant ce premier déploiement (le nom de fichier reste identique, pas de renommage nécessaire).

## Étape 5 — Domaine d'envoi Resend

1. Avec la clé API Resend centrale, `POST /domains` (nom = domaine du client) pour créer le domaine d'envoi.
2. Récupérer les enregistrements DNS retournés (SPF/DKIM/DMARC).
3. **Point d'arrêt manuel obligatoire** : ces enregistrements doivent être ajoutés dans la zone DNS du domaine du client — transmettre au client ou à la personne ayant accès à son registrar.
4. Poller `GET /domains/{id}` jusqu'à `verified`.
5. Reporter la clé API Resend centrale + `CONTACT_FROM` dans les secrets Supabase (étape 3) une fois le domaine vérifié.

## Étape 6 — Activer les briques souscrites

Se connecter avec le compte owner créé à l'étape 2, aller sur `/features`,
activer uniquement les briques du devis signé (toutes désactivées par
défaut sur une base fraîche — comportement inchangé, cf.
`docs/PNM-Sports-Roadmap-INTERNE.html`).

## Étape 7 — Connecter le domaine du client sur Vercel

Ajouter le domaine du client au projet Vercel (Project → Domains), suivre
les instructions DNS affichées (CNAME/A selon le cas). Domaine propre au
client, pas de sous-domaine PNM (décision retenue).

## Étape 8 — Vérifications de mise en service

- [ ] Connexion avec le compte owner : `/features` accessible.
- [ ] Créer un second compte admin (via `/agents`) : `/features` doit lui être **inaccessible** (redirection dashboard).
- [ ] Le nom/logo/couleur affichés correspondent au client, pas à PNM (vérifier login, sidebar, footer).
- [ ] Générer une fiche PDF joueur et un book : le nom du client apparaît dans le pied de page, pas "PNM Sports".
- [ ] Envoyer une fiche par email (si brique activée) : arrive bien depuis l'adresse `CONTACT_FROM` du client.
- [ ] `npm run build` sans erreur si un changement de code est fait localement avant le premier déploiement.
- [ ] Grep de contrôle sur le repo du client : `grep -rn "PNM Sports\|gaffoum" pnm-app/src` ne doit rien remonter en dehors de `src/config/brand.js` (valeurs par défaut, sans incidence tant que les `VITE_BRAND_*` sont définies sur Vercel).

## Une fois livré

Fournir au client son URL, son premier login (owner), et le guide
utilisateur (`pnm-app/public/guide-utilisateur.html` — à régénérer avec
son branding, cf. Phase 5 du plan, pas encore automatisé au moment de la
rédaction de ce runbook).
