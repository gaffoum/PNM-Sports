-- =====================================================================
-- 0008 — Compte "SuperAdmin" (gaffoum@gmail.com)
-- Les briques commerciales (/features) ne sont pilotables que par le
-- propriétaire de l'agence, pas par un administrateur classique.
-- Défense en profondeur : la restriction n'est pas qu'une question
-- d'affichage côté client, elle est aussi appliquée en base (RLS).
-- =====================================================================
create or replace function public.is_owner() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid() and lower(email) = 'gaffoum@gmail.com'
  );
$$;

drop policy if exists "features_admin_write" on public.features;
create policy "features_admin_write" on public.features
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
