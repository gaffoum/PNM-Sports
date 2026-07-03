-- =====================================================================
-- 0023 — Statut "owner" porté par une colonne plutôt qu'un email en dur
-- Nécessaire pour que le repo serve de template réutilisable par client :
-- is_owner() et la policy de protection ne doivent plus reconnaître un
-- seul email fixe. Le premier compte admin créé par scripts/setup.mjs sur
-- une base fraîche devient désormais is_owner = true automatiquement.
--
-- Sur cette base existante, on bascule l'ancien compte "SuperAdmin"
-- (identifié par son email) sur la nouvelle colonne pour ne rien casser.
-- =====================================================================

alter table public.agents add column if not exists is_owner boolean not null default false;

update public.agents set is_owner = true where lower(email) = 'gaffoum@gmail.com';

create or replace function public.is_owner() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid() and is_owner = true
  );
$$;

drop policy if exists "agents_protect_owner_delete" on public.agents;
create policy "agents_protect_owner_delete" on public.agents
  as restrictive for delete to authenticated
  using (is_owner = false or id = auth.uid());
