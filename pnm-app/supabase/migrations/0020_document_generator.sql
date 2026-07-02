-- =====================================================================
-- 0020 — Générateur de documents (mandats, contrats...)
-- (nouvelle brique media_generateur_documents, pack documents_media)
--
-- document_templates : modele reutilisable par type de document, avec
-- une liste de paragraphes contenant des variables {{...}} et la
-- definition du formulaire de saisie (champs). Gere par un admin.
--
-- generated_documents : instance generee a partir d'un modele + de
-- donnees saisies, avec un snapshot des paragraphes (editables avant
-- export PDF, independamment du modele d'origine).
-- =====================================================================

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  nom text not null,
  description text,
  paragraphes jsonb not null default '[]'::jsonb,
  champs jsonb not null default '[]'::jsonb,
  actif boolean not null default true,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists document_templates_type_idx on public.document_templates(type);

drop trigger if exists document_templates_set_updated_at on public.document_templates;
create trigger document_templates_set_updated_at
before update on public.document_templates
for each row execute function public.set_updated_at();

alter table public.document_templates enable row level security;

drop policy if exists "document_templates_select" on public.document_templates;
create policy "document_templates_select" on public.document_templates
  for select to authenticated
  using (public.is_agent());

drop policy if exists "document_templates_write" on public.document_templates;
create policy "document_templates_write" on public.document_templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_document_templates on public.document_templates;
create trigger trg_audit_document_templates
  after insert or update or delete on public.document_templates
  for each row execute function public.fn_audit_log();

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.document_templates(id) on delete set null,
  type text not null,
  titre text not null,
  player_id uuid references public.players(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  form_data jsonb not null default '{}'::jsonb,
  paragraphes jsonb not null default '[]'::jsonb,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'finalise')),
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists generated_documents_player_id_idx on public.generated_documents(player_id);
create index if not exists generated_documents_type_idx on public.generated_documents(type);

drop trigger if exists generated_documents_set_updated_at on public.generated_documents;
create trigger generated_documents_set_updated_at
before update on public.generated_documents
for each row execute function public.set_updated_at();

alter table public.generated_documents enable row level security;

drop policy if exists "generated_documents_select" on public.generated_documents;
create policy "generated_documents_select" on public.generated_documents
  for select to authenticated
  using (
    public.is_admin() or public.has_perm('view_all_players') or agent_id = auth.uid() or exists (
      select 1 from public.players p where p.id = generated_documents.player_id and p.agent_referent = auth.uid()
    )
  );

drop policy if exists "generated_documents_write" on public.generated_documents;
create policy "generated_documents_write" on public.generated_documents
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or agent_id = auth.uid() or exists (
      select 1 from public.players p where p.id = generated_documents.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or agent_id = auth.uid() or exists (
      select 1 from public.players p where p.id = generated_documents.player_id and p.agent_referent = auth.uid()
    )
  );

drop trigger if exists trg_audit_generated_documents on public.generated_documents;
create trigger trg_audit_generated_documents
  after insert or update or delete on public.generated_documents
  for each row execute function public.fn_audit_log();

insert into public.features (key, label, pack) values
  ('media_generateur_documents', 'Générateur de documents (contrats, mandats)', 'documents_media')
on conflict (key) do nothing;
