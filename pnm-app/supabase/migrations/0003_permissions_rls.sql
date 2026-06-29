-- =====================================================================
-- Migration : application des droits agents dans les politiques RLS
-- Rend les permissions (agents.permissions) réellement effectives.
-- À exécuter dans le SQL Editor du projet Supabase PNM.
-- (Nécessite la migration 0002 — colonne permissions.)
-- =====================================================================

-- Helper : l'agent courant possède-t-il un droit ? (admin = tous les droits)
create or replace function public.has_perm(perm text) returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid()
      and (role = 'admin' or coalesce((permissions ->> perm)::boolean, false))
  );
$$;

-- players : LECTURE = admin OU référent OU droit "voir tous les joueurs"
drop policy if exists "players_select_admin_or_referent" on public.players;
create policy "players_select_admin_or_referent" on public.players
  for select to authenticated
  using (
    public.is_admin()
    or agent_referent = auth.uid()
    or public.has_perm('view_all_players')
  );

-- players : MODIFICATION = admin OU référent OU droit "edit_players"
drop policy if exists "players_update_admin_or_referent" on public.players;
create policy "players_update_admin_or_referent" on public.players
  for update to authenticated
  using (public.is_admin() or agent_referent = auth.uid() or public.has_perm('edit_players'))
  with check (public.is_admin() or agent_referent = auth.uid() or public.has_perm('edit_players'));

-- players : SUPPRESSION = admin OU référent OU droit "delete_players"
drop policy if exists "players_delete_admin_or_referent" on public.players;
create policy "players_delete_admin_or_referent" on public.players
  for delete to authenticated
  using (public.is_admin() or agent_referent = auth.uid() or public.has_perm('delete_players'));

-- stats : lecture étendue au droit "voir tous les joueurs"
drop policy if exists "player_stats_select" on public.player_stats;
create policy "player_stats_select" on public.player_stats
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_stats.player_id
        and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

-- documents : lecture étendue au droit "voir tous les joueurs"
drop policy if exists "player_documents_select" on public.player_documents;
create policy "player_documents_select" on public.player_documents
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_documents.player_id
        and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );
