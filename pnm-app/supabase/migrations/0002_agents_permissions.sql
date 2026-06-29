-- =====================================================================
-- Migration : droits des agents (permissions) + activation
-- Additive et idempotente — sans risque pour la prod.
-- À exécuter une fois dans le SQL Editor du projet Supabase PNM.
-- =====================================================================

-- Droits attribuables à un agent (carte clé->bool). Vide par défaut.
alter table public.agents
  add column if not exists permissions jsonb not null default '{}'::jsonb;

-- Agent actif/désactivé (anticipation : suspendre un accès sans le supprimer)
alter table public.agents
  add column if not exists actif boolean not null default true;
