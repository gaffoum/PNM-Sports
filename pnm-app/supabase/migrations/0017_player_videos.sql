-- =====================================================================
-- 0017 — Brique "Galerie vidéos / highlights" (media_videos)
-- Liens video (YouTube/Vimeo/autre) rattaches a une fiche joueur.
-- =====================================================================

create table if not exists public.player_videos (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  titre text not null,
  url text not null,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists player_videos_player_id_idx on public.player_videos(player_id);

alter table public.player_videos enable row level security;

drop policy if exists "player_videos_select" on public.player_videos;
create policy "player_videos_select" on public.player_videos
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_videos.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_videos_write" on public.player_videos;
create policy "player_videos_write" on public.player_videos
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_videos.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_videos.player_id and p.agent_referent = auth.uid()
    )
  );
