-- =====================================================================
-- 0013 — Brique "Permissions fines par module" (secu_permissions_fines)
-- Ajoute 4 droits granulaires (manage_clubs, manage_pipeline,
-- manage_agenda, manage_scouting) et les intègre aux politiques RLS des
-- modules concernés, EN PLUS de edit_players (rétrocompatible : un
-- agent ayant déjà edit_players garde tous ses accès).
-- =====================================================================

-- ---- clubs / club_contacts / club_activity / club_needs -> manage_clubs
drop policy if exists "clubs_write" on public.clubs;
create policy "clubs_write" on public.clubs
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

drop policy if exists "club_contacts_write" on public.club_contacts;
create policy "club_contacts_write" on public.club_contacts
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

drop policy if exists "club_activity_write" on public.club_activity;
create policy "club_activity_write" on public.club_activity
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

drop policy if exists "club_needs_write" on public.club_needs;
create policy "club_needs_write" on public.club_needs
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

-- ---- player_deals / deal_commissions -> manage_pipeline
drop policy if exists "player_deals_write" on public.player_deals;
create policy "player_deals_write" on public.player_deals
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.players p where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.players p where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  );

drop policy if exists "deal_commissions_write" on public.deal_commissions;
create policy "deal_commissions_write" on public.deal_commissions
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  );

-- ---- appointments / player_interactions -> manage_agenda
drop policy if exists "appointments_write" on public.appointments;
create policy "appointments_write" on public.appointments
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  );

drop policy if exists "player_interactions_write" on public.player_interactions;
create policy "player_interactions_write" on public.player_interactions
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  );

-- ---- player_evaluations / player_contracts -> manage_scouting
drop policy if exists "player_evaluations_write" on public.player_evaluations;
create policy "player_evaluations_write" on public.player_evaluations
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  );

drop policy if exists "player_contracts_write" on public.player_contracts;
create policy "player_contracts_write" on public.player_contracts
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  );
