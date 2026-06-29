import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Indique si la configuration Supabase est présente (variables d'env du build).
export const supabaseConfigured = Boolean(url && anon);

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquant(s) pour ce build. " +
    "Vérifie les variables d'environnement Vercel (Production ET Preview). Voir .env.example."
  );
}

// Valeurs de repli pour éviter que createClient ne lève une exception au
// chargement (ce qui produirait un écran noir). main.jsx affichera un message
// clair si la config est absente, au lieu de planter silencieusement.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
