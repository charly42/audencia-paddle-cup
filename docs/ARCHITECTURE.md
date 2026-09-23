# Architecture — Audencia Padel Cup

## Site map
Public : `/` · `/tournament` (`/qualifiers`, `/main-event`, `/practice`) · `/teams` · `/team/[slug]` · `/promotion/[slug]` · `/schedule` · `/tickets` · `/tickets/[token]` · `/register` · `/supporters` · `/rules` · `/about` · `/privacy` · `/login`
Joueur : `/player` · `/player/profile`
Admin : `/admin` · `/live` · `/scores` · `/matches` · `/teams(/[id])` · `/check-in` · `/tickets` · `/practice` · `/content` · `/exports/[kind]`
Écrans : `/display` · `/display/[screen]`

## Flux clés
1. **Inscription** : formulaire 4 étapes → `registerTeamAction` (Zod, honeypot, rate limit, upload) → équipe + 2 joueurs + comptes → emails → page équipe publique.
2. **Billet** : `createTicketAction` (idempotent par email) → `/tickets/[token]` (QR = URL, token 144 bits) → scan admin → `check_in_ticket` (atomique).
3. **Score live** : `/admin/scores` → `setScoreAction` → `TournamentProvider.reportScore` → DB → Realtime → `LiveProvider` (refetch `/api/live`, polling de secours).
4. **Progression** : match `final` → `applyProgression` met à jour les statuts d'équipe → notifications in-app + email.
5. **Modes** : `event_settings.event_mode` pilote la homepage (pre_event / live / post_event).

## Décisions
- Repository pattern (demo | supabase) : le site fonctionne sans backend.
- Écritures uniquement via Server Actions + service role, après contrôle de rôle ; RLS en défense en profondeur.
- Temps réel = notification légère → refetch (les payloads Realtime n'ont pas les jointures).
- Réservations d'entraînement : fonction SQL avec verrou `FOR UPDATE` (pas de sur-réservation), liste d'attente promue automatiquement.

## MVP vs V2
MVP (présent) : tout ce qui précède. V2 : rappels programmés, push, Stripe, édition joueur, statistiques avancées, i18n complet.
