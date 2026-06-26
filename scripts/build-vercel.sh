#!/usr/bin/env bash
#
# Build combiné pour Vercel :
#   - la landing statique (racine du dépôt) est servie à la racine "/"
#   - l'app agents React (pnm-app) est buildée sous la base "/agent/" et
#     servie via les rewrites (/login, /dashboard, ...) — voir vercel.json
#
# Résultat dans ./site :
#   site/                -> landing (index.html, globe.js, assets/, ...)
#   site/agent/          -> app React (index.html + /agent/assets/...)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Build de l'app agents (base=/agent/)…"
( cd pnm-app && npm run build -- --base=/agent/ )

echo "▶ Assemblage de l'output combiné dans ./site…"
OUT="site"
rm -rf "$OUT"
mkdir -p "$OUT/agent"

# Fichiers statiques de la landing
cp index.html globe.js world-land.js world-110m.json "$OUT/"
cp -r assets uploads "$OUT/"

# Build de l'app agents sous /agent/
cp -r pnm-app/dist/. "$OUT/agent/"

echo "✔ Output prêt : $OUT (landing à la racine, app agents sous /agent/)"
