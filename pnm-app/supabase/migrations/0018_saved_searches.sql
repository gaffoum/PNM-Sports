-- =====================================================================
-- 0018 — Brique "Recherche avancée & filtres sauvegardés" (mobile_recherche)
-- Permet a chaque agent d'enregistrer une combinaison recherche+filtres
-- de la liste des joueurs pour la reappliquer en un clic.
-- =====================================================================

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  nom text not null,
  search text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists saved_searches_agent_id_idx on public.saved_searches(agent_id);

alter table public.saved_searches enable row level security;

drop policy if exists "saved_searches_select" on public.saved_searches;
create policy "saved_searches_select" on public.saved_searches
  for select to authenticated
  using (agent_id = auth.uid());

drop policy if exists "saved_searches_write" on public.saved_searches;
create policy "saved_searches_write" on public.saved_searches
  for all to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());
