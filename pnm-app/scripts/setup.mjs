// Idempotent setup pour le projet Supabase.
// 1. Applique le schema SQL via connexion Postgres directe (pg).
// 2. Cree les buckets Storage via API Supabase (service_role).
// 3. Cree le compte admin de demonstration et insere la ligne agents.
//
// Usage : npm run setup
// Necessite : .env.local avec SUPABASE_*, ADMIN_*.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const {
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NOM,
  ADMIN_PRENOM,
} = process.env;

if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_DB_PASSWORD) {
  console.error("Variables d'environnement manquantes. Voir .env.example.");
  process.exit(1);
}

const projectRef = new URL(VITE_SUPABASE_URL).host.split(".")[0];

function log(step, msg) {
  console.log(`[${step}]`, msg);
}

async function applySchema() {
  log("SQL", "Connexion a la base...");
  // Connexion directe (port 5432). Si bloque par IPv6, basculer sur pooler.
  const client = new pg.Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: "postgres",
    password: SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const sql = readFileSync(resolve(__dirname, "..", "supabase", "schema.sql"), "utf8");
  log("SQL", "Application du schema...");
  await client.query(sql);
  log("SQL", "Schema applique.");
  await client.end();
}

async function setupStorage(admin) {
  log("STORAGE", "Creation/MAJ des buckets...");
  const buckets = [
    { id: "player-photos", public: true, fileSizeLimit: 10 * 1024 * 1024 },
    { id: "player-documents", public: false, fileSizeLimit: 50 * 1024 * 1024 },
  ];
  for (const b of buckets) {
    const { data: existing } = await admin.storage.getBucket(b.id);
    if (existing) {
      log("STORAGE", `Bucket "${b.id}" existe deja, MAJ des options.`);
      await admin.storage.updateBucket(b.id, {
        public: b.public,
        fileSizeLimit: b.fileSizeLimit,
      });
    } else {
      const { error } = await admin.storage.createBucket(b.id, {
        public: b.public,
        fileSizeLimit: b.fileSizeLimit,
      });
      if (error) throw error;
      log("STORAGE", `Bucket "${b.id}" cree.`);
    }
  }
}

async function setupAdmin(admin) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    log("ADMIN", "ADMIN_EMAIL / ADMIN_PASSWORD absent, on skip.");
    return;
  }
  log("ADMIN", `Recherche utilisateur ${ADMIN_EMAIL}...`);
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  let userId;
  if (existing) {
    userId = existing.id;
    log("ADMIN", `Utilisateur deja present (${userId}), MAJ du mot de passe.`);
    await admin.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  } else {
    log("ADMIN", "Creation du nouvel utilisateur...");
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    log("ADMIN", `Utilisateur cree (${userId}).`);
  }

  log("ADMIN", "Upsert dans public.agents...");
  const { error: upsertErr } = await admin
    .from("agents")
    .upsert({
      id: userId,
      nom: ADMIN_NOM ?? "Admin",
      prenom: ADMIN_PRENOM ?? "PNM",
      email: ADMIN_EMAIL,
      role: "admin",
    }, { onConflict: "id" });
  if (upsertErr) throw upsertErr;
  log("ADMIN", "Compte admin pret.");
}

async function main() {
  try {
    await applySchema();
  } catch (e) {
    console.error("Echec SQL :", e.message);
    if (String(e.message).includes("ENETUNREACH") || String(e.code) === "ENETUNREACH") {
      console.error("\nLa connexion directe IPv6 est bloquee sur cette machine.");
      console.error("Solution : exposer le schema via l'editeur SQL Supabase ");
      console.error("(copier-coller supabase/schema.sql dans https://supabase.com/dashboard/project/" + projectRef + "/sql/new),");
      console.error("puis relancer ce script avec SUPABASE_SKIP_SQL=1 pour faire seulement Storage + Admin.");
    }
    if (process.env.SUPABASE_SKIP_SQL !== "1") process.exit(1);
  }

  const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await setupStorage(admin);
  await setupAdmin(admin);

  console.log("\nSetup termine. Tu peux lancer `npm run dev`.");
}

main().catch((e) => {
  console.error("Echec setup :", e);
  process.exit(1);
});
