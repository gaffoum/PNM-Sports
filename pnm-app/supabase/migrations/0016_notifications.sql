-- =====================================================================
-- 0016 — Brique "Notifications in-app" (comm_notifications)
-- Notifications personnelles par agent (cloche dans la barre latérale),
-- ecriture limitee a l'agent destinataire ou a un admin (envoi manuel /
-- automatique depuis une action applicative).
-- =====================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  message text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_agent_id_idx on public.notifications(agent_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select to authenticated
  using (agent_id = auth.uid());

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert to authenticated
  with check (agent_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete to authenticated
  using (agent_id = auth.uid());
