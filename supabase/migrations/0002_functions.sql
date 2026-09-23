-- ════════════════════════════════════════════════════════════════
-- Fonctions atomiques (appelées côté serveur avec la service role)
-- ════════════════════════════════════════════════════════════════

-- Places restantes sur une session (1 équipe = 2 places joueurs)
create or replace function practice_spots_taken(p_session uuid) returns integer
language sql stable as $$
  select coalesce(count(*), 0)::int * 2
  from practice_registrations where practice_session_id = p_session and status = 'booked';
$$;

-- Réservation atomique : verrou de ligne pour éviter le sur-remplissage.
-- Retourne : 'booked' | 'waitlist' | 'full' | 'duplicate' | 'closed'
create or replace function book_practice(p_session uuid, p_team uuid, p_profile uuid) returns text
language plpgsql security definer set search_path = public as $$
declare s practice_sessions%rowtype; taken int;
begin
  select * into s from practice_sessions where id = p_session for update;
  if not found or s.status <> 'open' then return 'closed'; end if;
  if exists (select 1 from practice_registrations
             where practice_session_id = p_session and team_id = p_team and status <> 'cancelled') then
    return 'duplicate';
  end if;
  taken := practice_spots_taken(p_session);
  if taken + 2 <= s.capacity then
    insert into practice_registrations (practice_session_id, team_id, profile_id, status) values (p_session, p_team, p_profile, 'booked');
    return 'booked';
  elsif s.waitlist_enabled then
    insert into practice_registrations (practice_session_id, team_id, profile_id, status) values (p_session, p_team, p_profile, 'waitlist');
    return 'waitlist';
  end if;
  return 'full';
end $$;

-- Annulation + promotion automatique de la liste d'attente.
-- Retourne l'id de l'équipe promue (ou null).
create or replace function cancel_practice(p_registration uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare r practice_registrations%rowtype; s practice_sessions%rowtype; nxt practice_registrations%rowtype;
begin
  select * into r from practice_registrations where id = p_registration for update;
  if not found or r.status = 'cancelled' then return null; end if;
  select * into s from practice_sessions where id = r.practice_session_id for update;
  update practice_registrations set status = 'cancelled' where id = r.id;
  if r.status = 'booked' then
    select * into nxt from practice_registrations
      where practice_session_id = r.practice_session_id and status = 'waitlist'
      order by created_at asc limit 1 for update;
    if found and practice_spots_taken(s.id) + 2 <= s.capacity then
      update practice_registrations set status = 'booked' where id = nxt.id;
      return nxt.team_id;
    end if;
  end if;
  return null;
end $$;

-- Check-in atomique d'un billet (token complet OU code court).
-- Retourne 'valid' | 'already' | 'invalid'
create or replace function check_in_ticket(p_key text, p_by uuid) returns table(result text, ticket_id uuid)
language plpgsql security definer set search_path = public as $$
declare t tickets%rowtype;
begin
  select * into t from tickets where token = p_key or code = upper(trim(p_key)) for update;
  if not found then return query select 'invalid'::text, null::uuid; return; end if;
  if t.checked_in_at is not null then return query select 'already'::text, t.id; return; end if;
  update tickets set checked_in_at = now(), checked_in_by = p_by where id = t.id;
  return query select 'valid'::text, t.id;
end $$;

-- Ces fonctions ne doivent être appelables que par la service role
revoke all on function book_practice(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function cancel_practice(uuid) from public, anon, authenticated;
revoke all on function check_in_ticket(text, uuid) from public, anon, authenticated;
