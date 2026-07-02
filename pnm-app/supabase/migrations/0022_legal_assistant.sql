-- =====================================================================
-- 0022 — Assistant IA droit du sport (data_assistant_juridique)
--
-- Base documentaire juridique (sources + extraits indexés en recherche
-- plein texte français) + historique des questions/réponses. La
-- recherche est lexicale (tsvector) et non vectorielle en v1 : évite une
-- dépendance supplémentaire (API d'embeddings) et convient bien à des
-- textes réglementaires où les numéros d'article comptent autant que le
-- sens. Les réponses sont produites par Claude, contraint à ne citer que
-- les extraits fournis (voir Edge Function legal-assistant-query).
-- =====================================================================

create table if not exists public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  categorie text not null check (categorie in ('fifa_rstp', 'fifa_ffar', 'uefa', 'code_sport', 'charte_lfp_fff', 'jurisprudence_cas', 'autre')),
  url_source text,
  actif boolean not null default true,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.legal_sources enable row level security;

drop policy if exists "legal_sources_select" on public.legal_sources;
create policy "legal_sources_select" on public.legal_sources
  for select to authenticated
  using (public.is_agent());

drop policy if exists "legal_sources_write" on public.legal_sources;
create policy "legal_sources_write" on public.legal_sources
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_legal_sources on public.legal_sources;
create trigger trg_audit_legal_sources
  after insert or update or delete on public.legal_sources
  for each row execute function public.fn_audit_log();

create table if not exists public.legal_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.legal_sources(id) on delete cascade,
  reference text,
  contenu text not null,
  ordre int not null default 0,
  search_vector tsvector generated always as (to_tsvector('french', coalesce(reference, '') || ' ' || contenu)) stored,
  created_at timestamptz not null default now()
);
create index if not exists legal_chunks_source_id_idx on public.legal_chunks(source_id);
create index if not exists legal_chunks_search_idx on public.legal_chunks using gin (search_vector);

alter table public.legal_chunks enable row level security;

drop policy if exists "legal_chunks_select" on public.legal_chunks;
create policy "legal_chunks_select" on public.legal_chunks
  for select to authenticated
  using (public.is_agent());

drop policy if exists "legal_chunks_write" on public.legal_chunks;
create policy "legal_chunks_write" on public.legal_chunks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Recherche plein texte utilisable par tout agent (contourne le besoin
-- d'exposer une fonction cote table pour classer par pertinence).
create or replace function public.search_legal_chunks(p_query text, p_limit int default 8)
returns table (
  id uuid, source_id uuid, reference text, contenu text,
  source_titre text, source_categorie text, rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.source_id, c.reference, c.contenu, s.titre, s.categorie,
    ts_rank(c.search_vector, websearch_to_tsquery('french', p_query)) as rank
  from public.legal_chunks c
  join public.legal_sources s on s.id = c.source_id and s.actif = true
  where c.search_vector @@ websearch_to_tsquery('french', p_query)
  order by rank desc
  limit p_limit;
$$;

grant execute on function public.search_legal_chunks(text, int) to authenticated;

create table if not exists public.legal_queries (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  question text not null,
  reponse text,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists legal_queries_agent_id_idx on public.legal_queries(agent_id);

alter table public.legal_queries enable row level security;

drop policy if exists "legal_queries_select" on public.legal_queries;
create policy "legal_queries_select" on public.legal_queries
  for select to authenticated
  using (public.is_admin() or agent_id = auth.uid());

drop policy if exists "legal_queries_insert" on public.legal_queries;
create policy "legal_queries_insert" on public.legal_queries
  for insert to authenticated
  with check (agent_id = auth.uid());

drop policy if exists "legal_queries_delete" on public.legal_queries;
create policy "legal_queries_delete" on public.legal_queries
  for delete to authenticated
  using (public.is_admin() or agent_id = auth.uid());

insert into public.features (key, label, pack) values
  ('data_assistant_juridique', 'Assistant IA droit du sport', 'data_scouting')
on conflict (key) do nothing;
