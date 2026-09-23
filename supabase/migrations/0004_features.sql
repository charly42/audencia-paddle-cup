-- ─────────────────────────────────────────────────────────────────────────────
-- 0004 — Bilingue, annonces, rappels, pronostics, encouragements, galerie, bénévoles
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Annonce d'urgence (site + écrans TV) ────────────────────────────────────
alter table event_settings add column if not exists announcement_fr   text;
alter table event_settings add column if not exists announcement_en   text;
alter table event_settings add column if not exists announcement_level text
  check (announcement_level in ('info','warning','urgent')) default 'info';
alter table event_settings add column if not exists announcement_until timestamptz;
alter table event_settings add column if not exists default_locale text
  check (default_locale in ('fr','en')) default 'fr';

-- ── Rappels automatiques : évite d'envoyer deux fois le même rappel ─────────
alter table matches add column if not exists reminder_sent_at timestamptz;

-- ── Pronostics ──────────────────────────────────────────────────────────────
create table if not exists predictions (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references matches(id) on delete cascade,
  team_id      uuid not null references teams(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete cascade,
  fingerprint  text not null,                 -- visiteur anonyme (haché)
  display_name text,
  points       int  not null default 0,       -- calculé quand le match se termine
  scored       boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (match_id, fingerprint)
);
create index if not exists predictions_match_idx   on predictions(match_id);
create index if not exists predictions_finger_idx  on predictions(fingerprint);

-- Attribution des points : appelée quand un match passe en 'final'.
create or replace function score_predictions(p_match uuid) returns int
language plpgsql security definer set search_path = public as $$
declare v_winner uuid; v_count int;
begin
  select case when team_a_score > team_b_score then team_a_id
              when team_b_score > team_a_score then team_b_id end
    into v_winner
    from matches where id = p_match and status = 'final';
  if v_winner is null then return 0; end if;
  update predictions
     set points = case when team_id = v_winner then 1 else 0 end, scored = true
   where match_id = p_match and scored = false;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function score_predictions(uuid) from public, anon, authenticated;

-- ── Mur d'encouragements (modéré) ───────────────────────────────────────────
create table if not exists cheers (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  author       text not null,
  message      text not null,
  fingerprint  text not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  moderated_by uuid references profiles(id),
  moderated_at timestamptz
);
create index if not exists cheers_team_idx   on cheers(team_id, status);
create index if not exists cheers_status_idx on cheers(status);

-- ── Galerie photos (après l'événement) ──────────────────────────────────────
create table if not exists gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  caption    text,
  credit     text,
  team_id    uuid references teams(id) on delete set null,
  sort_order int not null default 0,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Bénévoles et arbitres ───────────────────────────────────────────────────
create table if not exists volunteer_shifts (
  id         uuid primary key default gen_random_uuid(),
  role       text not null,                    -- ARBITRE, ACCUEIL, BUVETTE…
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  court_id   uuid references courts(id) on delete set null,
  capacity   int not null default 1,
  notes      text,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists volunteer_assignments (
  id         uuid primary key default gen_random_uuid(),
  shift_id   uuid not null references volunteer_shifts(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assignments_shift_idx on volunteer_assignments(shift_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table predictions           enable row level security;
alter table cheers                enable row level security;
alter table gallery_photos        enable row level security;
alter table volunteer_shifts      enable row level security;
alter table volunteer_assignments enable row level security;

-- Lecture publique : classement des pronostics, encouragements validés, galerie, planning.
create policy "read predictions" on predictions      for select using (true);
create policy "read cheers"      on cheers           for select using (status = 'approved' or is_admin());
create policy "read gallery"     on gallery_photos   for select using (true);
create policy "read shifts"      on volunteer_shifts for select using (true);
-- Les coordonnées des bénévoles ne sont PAS publiques.
create policy "read assignments" on volunteer_assignments for select using (is_admin());

-- Toute écriture passe par les Server Actions (service role) : aucune policy d'écriture.

-- ── Temps réel ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table predictions;

-- ── Modules activables par l'organisation ───────────────────────────────────
alter table event_settings add column if not exists predictions_enabled boolean not null default true;
alter table event_settings add column if not exists cheers_enabled      boolean not null default true;
alter table event_settings add column if not exists gallery_enabled     boolean not null default true;
alter table event_settings add column if not exists volunteers_enabled  boolean not null default false;
