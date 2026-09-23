# AUDENCIA PADEL CUP — STAFF vs STUDENTS

![CI](../../actions/workflows/ci.yml/badge.svg)

Plateforme événementielle (site vitrine, inscriptions, billetterie QR, bracket, scores live, admin, écrans campus).
Next.js (App Router) · TypeScript · Tailwind v4 · Supabase · Framer Motion.

> ⚠️ **Statut** : code écrit sans accès réseau — `npm install` / `next build` n'ont pas encore été exécutés. Voir « Premier lancement ».
> Aucune date, aucun tarif, aucune règle ni aucun sponsor officiel n'est inventé : tout est marqué `TO BE CONFIRMED BY ORGANIZER` et modifiable dans **/admin/content**.

## 0. Publier sur GitHub et déployer

> **GitHub Pages ne convient pas** : il n'héberge que des fichiers statiques. Ce site a besoin d'un serveur
> (Server Actions, API, temps réel). Le schéma recommandé : **le code sur GitHub, le site déployé par Vercel** (gratuit pour ce volume).

**1) Envoyer le code sur GitHub**

```bash
cd audencia-padel-cup
git init -b main
git add .
git commit -m "Audencia Padel Cup — initial commit"
# créez d'abord un dépôt VIDE sur github.com (sans README), puis :
git remote add origin https://github.com/<votre-compte>/audencia-padel-cup.git
git push -u origin main
```

`.env.local` est ignoré par git : vos clés ne partent jamais sur GitHub. La CI (`.github/workflows/ci.yml`) lance
`npm run build` à chaque push : si le code contient une erreur de type, elle apparaît dans l'onglet *Actions*.

**2) Déployer avec Vercel**

1. vercel.com → *Add New… → Project* → *Import* votre dépôt GitHub.
2. Framework : Next.js (détecté automatiquement). Ne changez rien.
3. *Environment Variables* : copiez celles de `.env.example`
   (au minimum `NEXT_PUBLIC_SITE_URL` = l'URL Vercel, puis les 3 clés Supabase).
4. *Deploy*. Chaque `git push` sur `main` redéploie automatiquement ; chaque pull request obtient un lien de prévisualisation.

**3) Après le premier déploiement**

- Supabase → Authentication → URL Configuration : ajoutez `https://<votre-site>.vercel.app/auth/callback`.
- Mettez `NEXT_PUBLIC_SITE_URL` à l'URL définitive (ou votre nom de domaine) puis redéployez.
- Créez l'admin : `npm run create-admin -- ton@email.com super_admin` (en local, avec `.env.local` rempli).

**Démo publique sans Supabase** : ajoutez `DEMO_MODE=true` dans Vercel pour activer la connexion démo.
Les données sont alors en mémoire et **se réinitialisent** (plusieurs instances serverless) : réservé à une démonstration,
jamais à l'événement réel.

## 1. Premier lancement (mode démo, sans Supabase)

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Sans variables Supabase, le site démarre en **mode démo** : données fictives en mémoire (bandeau « DEMO DATA »),
connexion démo sur `/login` (profils joueur + 4 rôles admin). La connexion démo est **désactivée en production**
(sauf `DEMO_MODE=true`).

Si `npm run build` signale une erreur de type, lancez `npm run typecheck` : le code n'a été vérifié
que syntaxiquement et avec des types partiels.

## 2. Brancher Supabase

1. Créez un projet Supabase. Copiez `URL`, `anon key`, `service_role key` dans `.env.local`.
2. Exécutez dans l'éditeur SQL, **dans l'ordre** : `supabase/migrations/0001_schema.sql`, `0002_functions.sql`, `0003_rls_realtime.sql`.
3. Authentication → URL Configuration : ajoutez `NEXT_PUBLIC_SITE_URL` et `NEXT_PUBLIC_SITE_URL/auth/callback` aux URLs de redirection.
4. Premier administrateur :
   ```bash
   npm run create-admin -- prenom.nom@audencia.com super_admin
   ```
   Puis connexion par lien magique sur `/login`. Rôles : `super_admin`, `event_admin`, `score_manager`, `checkin_staff`.
5. Données de démonstration (optionnel, identifiables et supprimables) :
   ```bash
   npm run seed          # insère (is_demo = true)
   npm run seed:clear    # supprime UNIQUEMENT les données is_demo
   ```

**Sécurité** : `SUPABASE_SERVICE_ROLE_KEY`, `CHALLONGE_API_KEY`, `RESEND_API_KEY` ne sont jamais préfixées `NEXT_PUBLIC_` et ne sont lues que côté serveur.
Les rôles ne peuvent pas être fixés par un utilisateur (trigger + RLS). Chaque action serveur revérifie le rôle.

## 3. Jour J

| Besoin | Où |
|---|---|
| Passer le site PRE-EVENT → LIVE → POST-EVENT | `/admin` → EVENT MODE |
| Saisir les scores au bord du terrain (mobile) | `/admin/scores` |
| Vue d'ensemble de tous les terrains | `/admin/live` |
| Scanner les billets / Team ID | `/admin/check-in` (HTTPS requis pour la caméra) |
| Écrans campus | `/display` (rotation) ou `/display/score`, `/live`, `/bracket`, `/courts`, `/teams`, `/qr` |

## 4. Moteur de tournoi (Local / Challonge)

`TOURNAMENT_PROVIDER=local` (défaut) ou `challonge` + `CHALLONGE_API_KEY` + `CHALLONGE_TOURNAMENT_ID`.
Les pages ne parlent qu'à l'interface `TournamentProvider` (`src/lib/tournament`). Challonge : synchronisation via
**/admin/matches → SYNC FROM CHALLONGE** ; les équipes sont appariées par **nom**. ⚠️ Non testé avec de vraies clés.

## 5. Emails, cartes sociales, PWA

- Emails : sans `RESEND_API_KEY`, ils sont affichés dans la console serveur.
- Cartes partageables : `/api/card/[slug]?format=post|story|og&template=auto|registered|qualified|match|champion&download=1`.
  Pour la police d'affichage, déposez `BigShoulders-Black.ttf` dans `public/fonts/`.
- PWA : `manifest.ts` + `public/sw.js` (shell hors-ligne uniquement ; les scores ne sont jamais mis en cache). Icônes générées dynamiquement (`/icons/192`, `/icons/512`).

## 6. Déploiement (Vercel)

Importez le dépôt, renseignez les variables de `.env.example`, déployez. Notes :
- La garde d'accès des routes `/admin` et `/player` est dans `src/proxy.ts` (convention Next 16, ex-`middleware.ts`).
- La limitation de débit (`src/lib/rate-limit.ts`) est en mémoire : en multi-instances, la remplacer par Upstash Redis (même signature).
- Les horaires saisis en admin (`datetime-local`) sont interprétés dans le fuseau du navigateur ; l'affichage se fait en `Europe/Paris`.

## 7. Fonctionnalités et modules

| Module | Page publique | Admin | Activation |
|---|---|---|---|
| Bilingue FR / EN | sélecteur dans l'en-tête | — | toujours actif |
| Annonce d'urgence | bandeau site + **écrans TV en grand** | `/admin/live` | à la demande |
| Rappels de match | notification + email aux joueurs | automatique | GitHub Actions (`.github/workflows/reminders.yml`) |
| Pronostics | `/predictions` | points attribués à la fin de chaque match | CONTENT |
| Mur d'encouragements | page de chaque équipe | `/admin/moderation` | CONTENT |
| Affiche imprimable | `/team/<slug>/poster` (A4, QR) | — | toujours actif |
| Récap partageable | bouton sur la page équipe | — | toujours actif |
| Galerie photos | `/gallery` | `/admin/gallery` | CONTENT |
| Bénévoles & arbitres | `/volunteers` | `/admin/volunteers` | CONTENT (désactivé par défaut) |

Les quatre derniers modules s'activent dans **/admin/content → MODULES PUBLICS**. Désactivé = page masquée (404).

**Rappels automatiques** : la route `/api/cron/reminders` doit être appelée toutes les 5 minutes.
Le cron de Vercel n'est pas utilisé : sur le plan gratuit (Hobby), il est limité à une exécution par jour.

1. Générez un secret : `openssl rand -hex 32`, et ajoutez-le dans Vercel comme variable `CRON_SECRET`
   (sans lui, la route refuse de s'exécuter en production).
2. **Option A — GitHub Actions (déjà en place)** : dans GitHub → Settings → Secrets and variables → Actions,
   créez `SITE_URL` (ex. `https://audencia-padel-cup.vercel.app`) et `CRON_SECRET` (même valeur que dans Vercel).
   Le workflow `reminders.yml` tourne alors toutes les 5 minutes ; testez-le avec *Actions → Rappels de match → Run workflow*.
   Limite : GitHub peut retarder l'exécution de quelques minutes aux heures chargées.
3. **Option B — cron-job.org (plus ponctuel, gratuit)** : créez une tâche toutes les 5 minutes sur
   `https://<votre-site>/api/cron/reminders`, méthode GET, avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.
   Dans ce cas, désactivez le workflow GitHub pour éviter les appels en double (ils sont sans effet, mais inutiles).

Chaque match n'est notifié qu'une seule fois, quel que soit le nombre d'appels.

**Bilingue FR / EN — tout le site, admin compris.** La langue est choisie avec le sélecteur de l'en-tête
(et de la barre latérale admin), mémorisée dans un cookie (`apc_lang`), avec repli sur la langue du navigateur puis le français.

- Textes d'interface : `src/lib/i18n/fr.ts` et `en.ts` (≈ 800 clés). Composant serveur : `const { t } = await i18n()` ;
  composant client : `const t = useT()` ; Server Action : `await tr("clé")`.
- `npm run check:i18n` vérifie que les deux fichiers ont les mêmes clés et qu'aucune clé utilisée ne manque (lancé par la CI).
- Contenus éditoriaux (accueil, à propos, règlement, confidentialité, annonce) : stockés en `{ fr, en }`, saisis en deux
  colonnes dans **/admin/content**. Un champ anglais vide affiche la version française.
- Images de partage : générées dans la langue de la personne qui les télécharge. Emails d'inscription et de billet :
  langue de la personne qui s'inscrit. Notifications (rappels, changement de terrain) : FR + EN dans le même email.
- Slogans de marque (« QUALIFY. REPRESENT. PLAY. CHALLENGE. », « STAFF vs STUDENTS ») : identiques dans les deux langues.

## 8. Charte graphique

Déclinaison événementielle de la charte Audencia. **Toutes les couleurs sont dans deux fichiers seulement** :
`src/app/globals.css` (bloc `@theme`) et `src/lib/brand.ts` (emails, cartes sociales, icônes PWA).
Les codes actuels sont des **valeurs approchées à remplacer par les codes officiels** :
la procédure, les rôles de chaque couleur et les contrôles de contraste sont dans **`docs/CHARTE.md`**.

## 9. Structure

```
supabase/migrations   schéma, fonctions atomiques (réservation, check-in), RLS + Realtime
scripts               seed, seed:clear, create-admin
src/lib/repo          couche de données : demo (mémoire) | supabase — contrat unique
src/lib/tournament    TournamentProvider : local | challonge
src/lib/actions       Server Actions (public, auth, player, admin)
src/components        ui / site / sport / admin
src/app/(site)        pages publiques + espace joueur
src/app/admin         back-office
src/app/display       écrans campus
src/app/api           /live (polling), /card (cartes sociales), /player/calendar (.ics)
```

## 10. Reste à faire / limites connues

- **Données saisies par l'organisation en une seule langue** : titres du programme de la journée, descriptions
  d'équipe, légendes photo, noms de partenaires. Les rendre bilingues demande une colonne supplémentaire en base.
- Paiement (Stripe) : billetterie gratuite uniquement ; brancher avant `repo.createTicket`.
- Galerie : les photos sont référencées par URL (pas d'upload multiple depuis l'admin).
- Aucun test automatisé. Rendu visuel non validé en navigateur.
- Édition des joueurs par eux-mêmes (photo individuelle) : non implémentée.
