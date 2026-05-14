# PNM Sports — Espace agents

Application interne de gestion des joueurs et prospects pour l'agence PNM Sports.

- **Frontend** : React 19 + Vite 8
- **Styling** : Tailwind CSS v3, composants UI maison (style cyan/marine de la marque)
- **Routing** : React Router v6
- **Backend & BDD** : Supabase (PostgreSQL + Auth + Storage + Row Level Security)
- **Hébergement** : Vercel (déploiement continu)

## Fonctionnalités

- 🔐 Auth Supabase email/mot de passe, reset password, sessions persistantes
- 👤 Comptes agents créés uniquement par un admin (pas d'inscription publique)
- 🛡️ RLS sur toutes les tables ; un agent ne voit que ses joueurs, sauf admin
- 📊 Dashboard : compteurs joueurs/prospects, contrats < 6 mois, activité récente
- ⚽ Joueurs & prospects : CRUD complet, recherche full-text, filtres multi-critères, tri, pagination serveur
- 📷 Upload photo avec recadrage rond 200×200 (react-easy-crop)
- 📁 Documents : upload privé (bucket Storage) avec signed URL à la demande
- 📈 Statistiques par saison
- 📝 Notes Markdown
- 📤 Export CSV, Excel (xlsx), PDF (`@react-pdf/renderer`)
- 🇪🇺 RGPD : consentement enregistré, droit à l'oubli (suppression complète y compris Storage)
- 📜 Activity log : toutes les actions agents sont tracées

## Démarrage

### Prérequis
- Node.js ≥ 20
- Un projet Supabase (URL + clés)

### Installation

```bash
git clone https://github.com/gaffoum/PNM-Sports.git
cd PNM-Sports/pnm-app
npm install
cp .env.example .env.local
# Remplir .env.local avec tes valeurs Supabase
npm run setup    # applique schema.sql, crée buckets, crée admin demo
npm run dev      # http://localhost:5173
```

### Variables d'environnement

| Variable | Usage | Côté |
|---|---|---|
| `VITE_SUPABASE_URL` | URL projet | client + serveur |
| `VITE_SUPABASE_ANON_KEY` | Clé anon (RLS appliquée) | client + serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin (script setup uniquement) | **serveur uniquement** |
| `SUPABASE_DB_PASSWORD` | Mot de passe Postgres (script setup) | **serveur uniquement** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte admin créé par setup | local uniquement |
| `ADMIN_NOM` / `ADMIN_PRENOM` | Identité de l'admin | local uniquement |

> ⚠️ Les variables `VITE_*` sont **embarquées dans le bundle client**. Ne mets jamais la `service_role` ou le mot de passe DB dans une variable préfixée `VITE_`.

### Compte admin de démonstration

Créé par `npm run setup` à partir des variables `ADMIN_*` du `.env.local`. Par défaut :

- Email : `gaffoum@gmail.com`
- Mot de passe : `123456` *(à changer après le 1er login via /profile)*

## Architecture

```
pnm-app/
├── src/
│   ├── components/
│   │   ├── auth/         (LoginForm, ProtectedRoute)
│   │   ├── players/      (PlayerForm, PlayerSearch, PhotoCropper, StatsTable, DocumentsList, PlayerPdf)
│   │   └── layout/       (AppLayout)
│   ├── pages/            (Login, Dashboard, PlayerList, PlayerDetail, PlayerCreate, Profile, ResetPassword)
│   ├── lib/              (supabaseClient, utils, logActivity)
│   ├── hooks/            (useAuth, usePlayers)
│   └── contexts/         (AuthContext)
├── scripts/setup.mjs     (DDL + Storage + admin user)
├── supabase/schema.sql   (schéma complet idempotent)
├── vercel.json
└── .env.example
```

## Schéma de base de données

Voir `supabase/schema.sql`. Tables :
- `agents` (liée à `auth.users`)
- `players`
- `player_stats`
- `player_documents`
- `activity_log`

RLS appliquée sur toutes les tables ; helper functions `is_admin()` et `is_agent()` (security definer).

Buckets Storage :
- `player-photos` — public en lecture, écriture par agents authentifiés
- `player-documents` — privé, accès via signed URL générée à la volée

## Déploiement Vercel

1. Importer le repo GitHub sur Vercel.
2. **Root Directory** : `pnm-app`.
3. Variables d'environnement Vercel à définir :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Vercel détectera Vite automatiquement (build = `npm run build`, output = `dist`).
5. Déploiement auto sur push `main`, previews sur les PR.

> Le script `scripts/setup.mjs` ne tourne **pas** sur Vercel — c'est un outil one-shot exécuté en local par un admin pour préparer le projet Supabase.

## Sécurité

- HTTPS forcé par Vercel
- Headers de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`) dans `vercel.json`
- Mots de passe stockés/vérifiés par Supabase Auth (bcrypt côté serveur)
- Aucun secret côté client (seule la clé `anon` est exposée, et la RLS empêche les accès non autorisés)
- Tous les uploads/lectures Storage passent par les policies RLS

## RGPD

- Consentement explicite avant création d'une fiche (checkbox + horodatage)
- Suppression complète d'une fiche : ligne `players` + lignes liées (`player_stats`, `player_documents`) + objets Storage (photos + documents)
- Données limitées à un usage interne, jamais exposées publiquement
