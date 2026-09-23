# Charte — déclinaison événementielle Audencia

## 1. Où se trouvent les couleurs

Toutes les couleurs du site viennent de **deux endroits, qui doivent rester identiques** :

| Fichier | Usage |
|---|---|
| `src/app/globals.css` (bloc `@theme`) | tout le site (classes Tailwind `bg-blue`, `text-lime`, …) |
| `src/lib/brand.ts` | emails, cartes sociales PNG, icônes PWA, confettis, `themeColor` |

Changer une couleur = modifier les deux fichiers avec le même code hexadécimal. Aucun autre fichier ne contient de couleur en dur.

## 2. ⚠️ Valeurs à valider

Les codes actuels sont des **approximations** du bleu institutionnel Audencia : le PDF officiel de la charte
n'était pas accessible. **À remplacer par les valeurs officielles avant toute diffusion publique.**

| Rôle | Code actuel | Remplacer par |
|---|---|---|
| Bleu institutionnel | `#0E2A6B` | bleu officiel Audencia |
| Bleu profond | `#081A44` | version foncée (ou 15 % de noir sur le bleu officiel) |
| Bleu clair | `#E3E9F7` | version claire (ou 10 % du bleu officiel sur blanc) |
| Fond de page | `#F5F4F0` | blanc officiel, ou `#FFFFFF` |
| Encre | `#14161B` | noir officiel |
| Accent événement | `#D9F24B` | voir §3 |

Polices : `Big Shoulders` (titres — ex-« Big Shoulders Display », famille renommée par Google) et `Hanken Grotesk` (texte), toutes deux libres et servies par
Google Fonts. Si la charte impose d'autres polices, les remplacer dans `src/app/layout.tsx` (import `next/font`)
et dans `FONTS` (`src/lib/brand.ts`).

## 3. Pourquoi un accent hors charte

La charte d'une école est conçue pour des documents institutionnels. Un site d'événement sportif a besoin
d'une couleur de **signalisation** : score en direct, bouton d'action, pastille LIVE, lisibles d'un coup d'œil
sur un téléphone en plein soleil et sur un écran à dix mètres. Le bleu seul ne remplit pas ce rôle.

L'accent (`--color-lime`) est donc **réservé à l'événement** et n'apparaît jamais à la place du bleu
institutionnel. Trois usages, pas plus :

1. l'état LIVE (pastille, bandeau, encadré du match en cours) ;
2. le score de l'équipe en tête, et le bouton d'action principal ;
3. un mot mis en exergue dans un titre XXL.

Si l'organisation préfère rester strictement dans la charte, remplacer `accent` par le bleu clair et le blanc :
le site reste lisible, mais le direct perd en impact. C'est une décision de l'organisateur.

## 4. Répartition (règle 60 / 30 / 10)

- **60 %** fond de page et blanc : respiration, lecture.
- **30 %** bleu Audencia : hero, en-têtes, pieds de page, aplats de marque.
- **10 %** encre et accent : scores, statuts, boutons.

## 5. Logo

Le site n'embarque aucun fichier de logo : il affiche un monogramme typographique. Pour utiliser le logo
officiel, déposer `public/logo-audencia.svg` et l'appeler dans `src/components/site/SiteHeader.tsx`
(bloc du monogramme) ainsi que dans `SiteFooter.tsx`. Respecter la zone de protection définie par la charte.

## 6. Accessibilité

Les paires de couleurs doivent rester conformes WCAG AA (4,5:1 pour le texte courant). Les couples utilisés :
blanc sur bleu, encre sur accent, encre sur fond de page, encre sur blanc. **Après avoir remplacé les codes
officiels, revérifier ces quatre contrastes** — notamment texte blanc sur le bleu officiel s'il est plus clair
que `#0E2A6B`. Aucun statut n'est signalé par la couleur seule : chaque badge porte une icône et un libellé.
