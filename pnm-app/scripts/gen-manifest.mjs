// Génère public/manifest.webmanifest à partir des variables VITE_BRAND_*
// avant chaque build (voir le script "prebuild" dans package.json), pour
// que la brique "Application mobile (PWA)" affiche la bonne identité sur
// un déploiement client sans édition manuelle du fichier.
//
// Les valeurs par défaut ci-dessous reprennent celles de src/config/brand.js
// (un script Node ne peut pas importer ce module, qui dépend de
// import.meta.env fourni par Vite).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const name = process.env.VITE_BRAND_NAME || "PNM Sports";
const themeColor = process.env.VITE_BRAND_THEME_COLOR || "#04101f";

const manifest = {
  name: `${name} — Espace agents`,
  short_name: name,
  description: `Espace agents ${name} : gestion de joueurs, prospection, clubs et pipeline.`,
  start_url: "/dashboard",
  scope: "/",
  display: "standalone",
  background_color: themeColor,
  theme_color: themeColor,
  icons: [
    { src: "/logo-pnm.png", sizes: "192x192", type: "image/png" },
    { src: "/logo-pnm.png", sizes: "512x512", type: "image/png" },
  ],
};

const outPath = resolve(__dirname, "..", "public", "manifest.webmanifest");
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("[MANIFEST]", outPath, "généré pour", name);
