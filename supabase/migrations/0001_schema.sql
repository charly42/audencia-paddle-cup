-- ════════════════════════════════════════════════════════════════
-- AUDENCIA PADEL CUP — schéma principal
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────
create type user_role      as enum ('player','super_admin','event_admin','score_manager','checkin_staff');
create type event_mode     as enum ('pre_event','live','post_event');
create type team_status    as enum ('registered','pending','qualified','eliminated','semi_finalist','finalist','champion');
create type team_kind      as enum ('student','staff');
create type match_status   as enum ('upcoming','check_in','warm_up','live','final','postponed','cancelled');
create type skill_level    as enum ('beginner','intermediate','advanced');
create type ticket_type    as enum ('spectator','supporter','staff','player');
create type tournament_type as enum ('qualifiers','main','staff_vs_students');

-- ── Profils (1-1 avec auth.users) ───────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  first_name  text,
  last_name   text,
  role        user_role not null default 'player',
  created_at  timestamptz not null default now()
);

-- Création automatique du profil. Le rôle est TOUJOURS 'player' :
-- il ne peut jamais être fixé par les métadonnées utilisateur.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    'player'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Promotions ──────────────────────────────────────────────────
create table promotions (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  slug     text not null unique,
  program  text,
  active   boolean not null default true,
  is_demo  boolean not null default false
);

-- ── Équipes ─────────────────────────────────────────────────────
create table teams (
  id               uuid primary key default gen_random_uuid(),
  team_code        text not null unique default ('APC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))),
  name             text not null,
  slug             text not null unique,
  promotion_id     uuid references promotions(id) on delete set null,
  program          text,
  kind             team_kind not null default 'student',
  status           team_status not null default 'registered',
  photo_url        text,
  description      text,
  supporters_count integer not null default 0,
  external_id      text,               -- id participant Challonge (optionnel)
  is_demo          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index teams_promotion_idx on teams(promotion_id);

-- ── Joueurs ─────────────────────────────────────────────────────
create table players (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references profiles(id) on delete set null,
  team_id       uuid not null references teams(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  skill_level   skill_level not null default 'intermediate',
  is_captain    boolean not null default false,
  photo_url     text,
  checked_in_at timestamptz,
  checked_in_by uuid references profiles(id) on delete set null,
  is_demo       boolean not null default false
);
create index players_team_idx on players(team_id);
create index players_profile_idx on players(profile_id);
create index players_email_idx on players(lower(email));

-- ── Tournois & terrains ─────────────────────────────────────────
create table tournaments (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  type        tournament_type not null,
  provider    text not null default 'local',   -- local | challonge
  status      text not null default 'draft',   -- draft | running | finished
  external_id text
);

create table courts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0,
  active     boolean not null default true
);

-- ── Matchs ──────────────────────────────────────────────────────
create table matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  team_a_id     uuid references teams(id) on delete set null,
  team_b_id     uuid references teams(id) on delete set null,
  team_a_score  integer not null default 0 check (team_a_score >= 0),
  team_b_score  integer not null default 0 check (team_b_score >= 0),
  court_id      uuid references courts(id) on delete set null,
  scheduled_at  timestamptz,
  started_at    timestamptz,
  ended_at      timestamptz,
  status        match_status not null default 'upcoming',
  paused        boolean not null default false,
  round         text not null default 'group',  -- group | r16 | quarter | semi | final | game
  round_order   integer not null default 0,
  position      integer not null default 0,     -- position dans le round (bracket)
  promotion_id  uuid references promotions(id) on delete set null, -- qualifs ping-pong par promo
  game_no       integer,                        -- STAFF vs STUDENTS : 1, 2, 3
  points_value  integer not null default 1,     -- points au score global
  external_id   text,
  is_demo       boolean not null default false,
  updated_at    timestamptz not null default now()
);
create index matches_tournament_idx on matches(tournament_id, round_order, position);
create index matches_status_idx on matches(status);
create index matches_teams_idx on matches(team_a_id, team_b_id);

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger matches_touch before update on matches for each row execute function touch_updated_at();

-- ── Practice sessions ───────────────────────────────────────────
create table practice_sessions (
  id           uuid primary key default gen_random_uuid(),
  session_date date not null,
  start_time   time not null,
  duration_min integer not null default 90,
  courts_count integer not null default 2,
  capacity     integer not null default 8,      -- nombre de PLACES JOUEURS (1 équipe = 2 places)
  coach        boolean not null default false,
  level        text not null default 'all',     -- all | beginner | intermediate | advanced
  status       text not null default 'open',    -- open | closed | cancelled
  location     text not null default '4PADEL Saint-Ouen',
  waitlist_enabled boolean not null default true,
  is_demo      boolean not null default false
);

create table practice_registrations (
  id                  uuid primary key default gen_random_uuid(),
  practice_session_id uuid not null references practice_sessions(id) on delete cascade,
  team_id             uuid not null references teams(id) on delete cascade,
  profile_id          uuid references profiles(id) on delete set null,
  status              text not null default 'booked' check (status in ('booked','waitlist','cancelled')),
  created_at          timestamptz not null default now()
);
-- Empêche le doublon d'une équipe sur une même session (hors annulées)
create unique index practice_no_duplicate on practice_registrations(practice_session_id, team_id) where status <> 'cancelled';

-- ── Billetterie ─────────────────────────────────────────────────
create table tickets (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique default encode(gen_random_bytes(18), 'hex'),  -- non devinable (144 bits)
  code          text not null unique,                                              -- code court saisie manuelle
  first_name    text not null,
  last_name     text not null,
  email         text not null,
  ticket_type   ticket_type not null default 'spectator',
  promotion_id  uuid references promotions(id) on delete set null,
  checked_in_at timestamptz,
  checked_in_by uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  is_demo       boolean not null default false
);
-- Un billet gratuit par email (évite le spam ; ré-inscription = renvoi du même billet)
create unique index tickets_one_per_email on tickets(lower(email));

-- ── Paramètres & contenus ───────────────────────────────────────
create table event_settings (
  id                    integer primary key default 1 check (id = 1),
  event_mode            event_mode not null default 'pre_event',
  event_name            text not null default 'AUDENCIA PADEL CUP',
  event_date            timestamptz,                         -- NULL = placeholder « date à annoncer »
  venue                 text not null default '4PADEL Saint-Ouen',
  registration_open     boolean not null default true,
  registration_deadline timestamptz,
  ticketing_open        boolean not null default true,
  ticket_capacity       integer,                             -- NULL = illimité
  headline              text not null default 'STAFF vs STUDENTS',
  tagline               text not null default 'QUALIFY. REPRESENT. PLAY. CHALLENGE.',
  supporters_award_enabled boolean not null default false,
  sponsors_enabled      boolean not null default false,
  updated_at            timestamptz not null default now()
);
insert into event_settings (id) values (1) on conflict do nothing;

create table content_blocks (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  website     text,
  tier        text not null default 'main' check (tier in ('main','partner','supporter')),
  description text,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

create table schedule_items (
  id          uuid primary key default gen_random_uuid(),
  start_time  text not null,          -- 'HH:MM' (heure affichée, administrable)
  title       text not null,
  description text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  is_demo     boolean not null default false
);

-- ── Notifications joueur & soutiens ─────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind       text not null default 'info',
  title      text not null,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on notifications(profile_id, created_at desc);

create table team_supports (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  fingerprint text not null,           -- hash(cookie + ip + sel), jamais l'IP brute
  created_at  timestamptz not null default now(),
  unique (team_id, fingerprint)
);

create or replace function bump_supporters() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update teams set supporters_count = supporters_count + 1 where id = new.team_id;
  elsif tg_op = 'DELETE' then
    update teams set supporters_count = greatest(supporters_count - 1, 0) where id = old.team_id;
  end if;
  return null;
end $$;
create trigger team_supports_count after insert or delete on team_supports for each row execute function bump_supporters();

-- ── Données structurelles (pas des données démo) ────────────────
insert into tournaments (slug, name, type) values
  ('qualifiers',        'Ping-pong Qualifiers',       'qualifiers'),
  ('main-event',        'Student Padel Cup',          'main'),
  ('staff-vs-students', 'STAFF vs STUDENTS',          'staff_vs_students')
on conflict (slug) do nothing;

insert into courts (name, sort_order) values
  ('Court 01',1),('Court 02',2),('Court 03',3),('Court 04',4),
  ('Court 05',5),('Court 06',6),('Court 07',7),('Center Court',8)
on conflict (name) do nothing;

insert into partners (name, website, tier, description, sort_order) values
  ('Audencia', null, 'main', 'Campus Paris Saint-Ouen — 122 boulevard Victor Hugo, 93400 Saint-Ouen-sur-Seine', 1),
  ('4PADEL Saint-Ouen', null, 'main', '29 rue Émile Cordon, 93400 Saint-Ouen-sur-Seine', 2);
