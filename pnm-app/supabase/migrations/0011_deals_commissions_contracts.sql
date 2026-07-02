-- =====================================================================
-- 0011 — Briques "Pipeline transferts & mandats" (placement_pipeline),
-- "Commissions & revenus" (placement_commissions) et
-- "Gestion des contrats joueurs" (placement_contrats)
-- (flags déjà présents au catalogue depuis la migration 0005)
-- =====================================================================

-- ---------------------------------------------------------------------
-- player_deals : négociations joueur -> club (distinct de la prospection)
-- ---------------------------------------------------------------------
create table if not exists public.player_deals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  type text not null default 'transfert' check (type in ('transfert', 'pret', 'essai')),
  statut text not null default 'en_discussion'
    check (statut in ('en_discussion', 'offre_recue', 'accord_verbal', 'signe', 'refuse', 'abandonne')),
  montant_propose numeric(12,2),
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_deals_player_id_idx on public.player_deals(player_id);
create index if not exists player_deals_club_id_idx on public.player_deals(club_id);
create index if not exists player_deals_statut_idx on public.player_deals(statut);

drop trigger if exists player_deals_set_updated_at on public.player_deals;
create trigger player_deals_set_updated_at
before update on public.player_deals
for each row execute function public.set_updated_at();

alter table public.player_deals enable row level security;

drop policy if exists "player_deals_select" on public.player_deals;
create policy "player_deals_select" on public.player_deals
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_deals_write" on public.player_deals;
create policy "player_deals_write" on public.player_deals
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- deal_commissions : commissions rattachées à un deal
-- ---------------------------------------------------------------------
create table if not exists public.deal_commissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.player_deals(id) on delete cascade,
  montant numeric(12,2) not null,
  statut text not null default 'attendue' check (statut in ('attendue', 'facturee', 'encaissee')),
  date_echeance date,
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deal_commissions_deal_id_idx on public.deal_commissions(deal_id);

drop trigger if exists deal_commissions_set_updated_at on public.deal_commissions;
create trigger deal_commissions_set_updated_at
before update on public.deal_commissions
for each row execute function public.set_updated_at();

alter table public.deal_commissions enable row level security;

drop policy if exists "deal_commissions_select" on public.deal_commissions;
create policy "deal_commissions_select" on public.deal_commissions
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "deal_commissions_write" on public.deal_commissions;
create policy "deal_commissions_write" on public.deal_commissions
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- player_contracts : au-delà de players.fin_contrat (clauses, salaire...)
-- ---------------------------------------------------------------------
create table if not exists public.player_contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  date_debut date,
  date_fin date,
  salaire_annuel numeric(12,2),
  clause_liberatoire text,
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_contracts_player_id_idx on public.player_contracts(player_id);

drop trigger if exists player_contracts_set_updated_at on public.player_contracts;
create trigger player_contracts_set_updated_at
before update on public.player_contracts
for each row execute function public.set_updated_at();

alter table public.player_contracts enable row level security;

drop policy if exists "player_contracts_select" on public.player_contracts;
create policy "player_contracts_select" on public.player_contracts
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_contracts_write" on public.player_contracts;
create policy "player_contracts_write" on public.player_contracts
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  );
