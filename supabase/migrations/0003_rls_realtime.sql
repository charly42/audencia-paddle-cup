-- ════════════════════════════════════════════════════════════════
-- Row Level Security + Realtime + Storage
-- Note : le serveur Next.js utilise la service role (bypass RLS) après avoir
-- vérifié le rôle. Ces politiques protègent tout accès DIRECT depuis le navigateur
-- (clé anon) — notamment les abonnements Realtime.
-- ════════════════════════════════════════════════════════════════

create or replace function app_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(app_role() in ('super_admin','event_admin'), false);
$$;

alter table profiles               enable row level security;
alter table promotions             enable row level security;
alter table teams                  enable row level security;
alter table players                enable row level security;
alter table tournaments            enable row level security;
alter table courts                 enable row level security;
alter table matches                enable row level security;
alter table practice_sessions      enable row level security;
alter table practice_registrations enable row level security;
alter table tickets                enable row level security;
alter table event_settings         enable row level security;
alter table content_blocks         enable row level security;
alter table partners               enable row level security;
alter table schedule_items         enable row level security;
alter table notifications          enable row level security;
alter table team_supports          enable row level security;

-- Lecture publique (contenu du site)
create policy "public read promotions"   on promotions        for select using (true);
create policy "public read teams"        on teams             for select using (true);
create policy "public read tournaments"  on tournaments       for select using (true);
create policy "public read courts"       on courts            for select using (true);
create policy "public read matches"      on matches           for select using (true);
create policy "public read practice"     on practice_sessions for select using (true);
create policy "public read settings"     on event_settings    for select using (true);
create policy "public read content"      on content_blocks    for select using (true);
create policy "public read partners"     on partners          for select using (active);
create policy "public read schedule"     on schedule_items    for select using (active);

-- Profils : chacun voit le sien ; les admins voient tout. Aucune écriture client.
create policy "own profile"   on profiles for select using (id = auth.uid() or is_admin());

-- Joueurs (données personnelles) : mon équipe + admins
create policy "team members read players" on players for select using (
  is_admin() or profile_id = auth.uid()
  or team_id in (select team_id from players where profile_id = auth.uid())
);

-- Réservations d'entraînement : mon équipe + admins
create policy "own practice registrations" on practice_registrations for select using (
  is_admin() or team_id in (select team_id from players where profile_id = auth.uid())
);

-- Billets : admins + check-in (aucun accès anonyme)
create policy "staff read tickets" on tickets for select using (app_role() in ('super_admin','event_admin','checkin_staff'));

-- Notifications : propres à l'utilisateur
create policy "own notifications read"   on notifications for select using (profile_id = auth.uid());
create policy "own notifications update" on notifications for update using (profile_id = auth.uid());

-- Écritures admin directes (défense en profondeur ; l'app passe par le serveur)
create policy "admin write teams"    on teams             for all using (is_admin()) with check (is_admin());
create policy "admin write matches"  on matches           for all using (is_admin()) with check (is_admin());
create policy "score manager update" on matches           for update using (app_role() = 'score_manager') with check (app_role() = 'score_manager');
create policy "admin write settings" on event_settings    for all using (is_admin()) with check (is_admin());
create policy "admin write content"  on content_blocks    for all using (is_admin()) with check (is_admin());
create policy "admin write partners" on partners          for all using (is_admin()) with check (is_admin());
create policy "admin write practice" on practice_sessions for all using (is_admin()) with check (is_admin());

-- ── Realtime ────────────────────────────────────────────────────
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table event_settings;

-- ── Storage : photos d'équipes / joueurs (lecture publique, upload via serveur) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-photos', 'team-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
