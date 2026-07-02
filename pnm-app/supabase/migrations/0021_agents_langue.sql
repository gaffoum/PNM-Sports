-- =====================================================================
-- 0021 — Multilingue étendu à toute l'application (vitrine_multilingue)
-- Préférence de langue persistée par agent (et non juste localStorage),
-- pour suivre l'agent d'un appareil à l'autre.
--
-- La table agents n'autorise l'update que par un admin (agents_admin_all).
-- Plutôt que d'ouvrir une policy self-update sur toute la ligne (ce qui
-- laisserait un agent modifier son propre role/permissions), on expose
-- une fonction security definer strictement bornée à la colonne langue.
-- =====================================================================

alter table public.agents add column if not exists langue text not null default 'fr' check (langue in ('fr', 'en'));

create or replace function public.update_my_langue(p_langue text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_langue not in ('fr', 'en') then
    raise exception 'Langue invalide : %', p_langue;
  end if;
  update public.agents set langue = p_langue where id = auth.uid();
end;
$$;

grant execute on function public.update_my_langue(text) to authenticated;
