-- =====================================================================
-- 0019 — Pack "Vitrine & présence en ligne"
-- (vitrine_public_joueurs, vitrine_multilingue, vitrine_blog)
--
-- Les pages vitrine sont publiques (visiteurs non authentifiés), qui ne
-- peuvent pas lire la table features (RLS reservee a authenticated). On
-- expose donc une fonction is_feature_enabled() en security definer,
-- utilisable par le role anon, pour garder le meme principe de "brique
-- eteinte tant que non activee" sur les pages publiques.
-- =====================================================================

create or replace function public.is_feature_enabled(p_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select enabled from public.features where key = p_key), false);
$$;

grant execute on function public.is_feature_enabled(text) to anon, authenticated;

-- ---- vitrine_public_joueurs : espace public joueurs ----
alter table public.players add column if not exists vitrine_public boolean not null default false;

create or replace function public.get_vitrine_joueurs()
returns table (
  id uuid, prenom text, nom text, poste text, nationalite text,
  date_naissance date, club_actuel text, photo_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.prenom, p.nom, p.poste, p.nationalite, p.date_naissance, p.club_actuel, p.photo_url
  from public.players p
  where p.vitrine_public = true
    and p.consentement_rgpd = true
    and public.is_feature_enabled('vitrine_public_joueurs')
  order by p.nom;
$$;

grant execute on function public.get_vitrine_joueurs() to anon, authenticated;

-- ---- vitrine_blog : blog / actualités ----
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  slug text not null unique,
  extrait text,
  contenu text not null,
  publie boolean not null default false,
  published_at timestamptz,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_publie_idx on public.blog_posts(publie);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_select_authenticated" on public.blog_posts;
create policy "blog_posts_select_authenticated" on public.blog_posts
  for select to authenticated
  using (public.is_admin() or publie = true);

drop policy if exists "blog_posts_write" on public.blog_posts;
create policy "blog_posts_write" on public.blog_posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_blog_posts on public.blog_posts;
create trigger trg_audit_blog_posts
  after insert or update or delete on public.blog_posts
  for each row execute function public.fn_audit_log();

create or replace function public.get_vitrine_blog_posts()
returns table (
  id uuid, titre text, slug text, extrait text, contenu text, published_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select b.id, b.titre, b.slug, b.extrait, b.contenu, b.published_at
  from public.blog_posts b
  where b.publie = true
    and public.is_feature_enabled('vitrine_blog')
  order by b.published_at desc nulls last, b.created_at desc;
$$;

grant execute on function public.get_vitrine_blog_posts() to anon, authenticated;
