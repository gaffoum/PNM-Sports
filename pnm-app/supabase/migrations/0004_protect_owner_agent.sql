-- =====================================================================
-- 0004 — Protection du compte propriétaire
-- Empêche la suppression directe (client PostgREST) de la fiche du compte
-- propriétaire (gaffoum@gmail.com) par quelqu'un d'autre que lui-même.
--
-- La suppression « réelle » (utilisateur auth) passe par la fonction edge
-- admin-delete-agent (service_role) qui applique la même règle côté serveur ;
-- les cascades de clés étrangères ne sont pas soumises à RLS, donc cette
-- politique ne bloque pas la suppression légitime via la fonction.
--
-- Politique RESTRICTIVE : se combine en ET avec les politiques permissives
-- existantes (agents_admin_all).
-- =====================================================================
drop policy if exists "agents_protect_owner_delete" on public.agents;
create policy "agents_protect_owner_delete" on public.agents
  as restrictive for delete to authenticated
  using (lower(email) <> 'gaffoum@gmail.com' or id = auth.uid());
