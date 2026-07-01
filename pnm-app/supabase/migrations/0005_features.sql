-- =====================================================================
-- 0005 — Système de "briques" (feature flags)
-- Chaque évolution facturable est développée en avance de vente, mergée
-- en prod DÉSACTIVÉE (enabled = false), et activée d'un simple update
-- (ou via la page admin /features) une fois le devis accepté par le client.
-- =====================================================================
create table if not exists public.features (
  key text primary key,
  label text not null,
  pack text,
  enabled boolean not null default false,
  enabled_at timestamptz,
  enabled_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.features enable row level security;

-- Lecture : tout agent authentifié (l'UI doit savoir quoi afficher).
drop policy if exists "features_select_authenticated" on public.features;
create policy "features_select_authenticated" on public.features
  for select to authenticated
  using (public.is_agent());

-- Écriture (activation/désactivation) : admin uniquement.
drop policy if exists "features_admin_write" on public.features;
create policy "features_admin_write" on public.features
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Catalogue initial des briques (toutes désactivées par défaut).
insert into public.features (key, label, pack) values
  ('data_besoccer',        'Connexion BeSoccer Pro',            'data_scouting'),
  ('data_radar_reel',      'Radar de notation réel',            'data_scouting'),
  ('data_scouting_interne','Scouting interne (grille agents)',  'data_scouting'),
  ('data_comparaison',     'Comparaison de joueurs',             'data_scouting'),
  ('placement_clubs',      'Annuaire clubs & contacts',          'placement_crm'),
  ('placement_pipeline',   'Pipeline transferts & mandats',      'placement_crm'),
  ('placement_commissions','Commissions & revenus',              'placement_crm'),
  ('placement_contrats',   'Gestion avancée des contrats',       'placement_crm'),
  ('placement_agenda',     'Agenda & rappels',                   'placement_crm'),
  ('placement_historique', 'Historique d''interactions',         'placement_crm'),
  ('comm_emails',          'Emails automatiques',                'communication'),
  ('comm_notifications',  'Notifications in-app',                'communication'),
  ('comm_envoi_pdf',       'Envoi de fiche PDF par email',       'communication'),
  ('media_videos',         'Galerie vidéos / highlights',        'documents_media'),
  ('media_signature',      'Signature électronique',             'documents_media'),
  ('media_book',           'Book / plaquette joueur',            'documents_media'),
  ('pilotage_dashboard',   'Tableau de bord avancé',              'mobile_pilotage'),
  ('pilotage_rapports',    'Rapports périodiques',                'mobile_pilotage'),
  ('pilotage_portefeuille','Vue portefeuille & valorisation',    'mobile_pilotage'),
  ('secu_permissions_fines','Permissions fines par module',      'securite'),
  ('secu_audit',           'Journal d''audit complet',            'securite'),
  ('secu_2fa',             'Authentification renforcée (2FA)',   'securite'),
  ('secu_rgpd',            'Conformité RGPD avancée',             'securite'),
  ('vitrine_public_joueurs','Espace public joueurs',              'vitrine'),
  ('vitrine_multilingue',  'Multilingue (FR/EN)',                 'vitrine'),
  ('vitrine_blog',         'Blog / actualités',                   'vitrine'),
  ('mobile_pwa',           'Application mobile (PWA)',            'mobile_pilotage'),
  ('mobile_recherche',     'Recherche avancée & filtres sauvegardés', 'mobile_pilotage')
on conflict (key) do nothing;
