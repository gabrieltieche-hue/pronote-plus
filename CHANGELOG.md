# Changelog

Toutes les modifications notables de Pronote+ sont documentées ici.

## [0.3.2] - 2026-06-07

### Security
- Mot de passe Pronote maintenant chiffré réellement dans le cache de session serveur (`encryptedPassword` AES-256-GCM), avec tests de non-stockage en clair.
- Logout client relié à `/api/auth/logout` pour révoquer la session serveur avant le nettoyage local.

### Fixed
- Préférence "Se souvenir de l'URL Pronote" synchronisée entre Paramètres et Login.
- Textes de sécurité corrigés : le token navigateur ne contient pas le mot de passe, il référence une session serveur.

## [0.3.1] - 2026-06-05

### 🐛 Fixed (critiques)
- **Messagerie crash** `(discussions || []).find is not a function` : backend renvoyait `{discussions:[]}` au lieu d'array, signature Pawnote corrigée (`data.items`, `data.sents`, `participantsMessageID`), cache mutable par user.
- **EDT cassé week-end off** : grille figée `repeat(7, ...)` même si week-end masqué. Maintenant dynamique `repeat(N, ...)`.
- **EDT tailles de cours toutes identiques** : refonte avec positionnement **absolu proportionnel** dans chaque colonne jour (top/height calculés depuis minutes), gestion heures partielles (8h30→9h50).
- **Devoirs avec `<div>` HTML brut** : `stripHtml` côté backend, `\n` rendus via `white-space: pre-wrap` (déjà en place).
- **Vie scolaire — champs Pawnote réels** : `minutesMissed`/`hoursMissed`/`daysMissed` (absences), `title`/`reasons[]`/`durationMinutes`/`exclusion` (sanctions), `justification` (retards), `name`/`kind` (observations). Ajout `precautionaryMeasures`.
- **Settings caché sur desktop** : "Paramètres" déplacé dans un menu avatar dropdown (user menu avec click-outside, ESC, ARIA), breakpoint abaissé à 720px.
- **JWT_SECRET dev faible** : génération aléatoire 48-byte hex éphémère si non défini (au lieu de `'dev-only-not-for-production'`).
- **ENCRYPTION_KEY couplé à JWT_SECRET** : maintenant dérivé d'un `ENCRYPTION_KEY` indépendant, .env.example créé.
- **CORS `*` + credentials** : interdit en production (refuse credentials si `CORS_ORIGIN=*`).
- **Pas de rate-limit général** : `apiLimiter` 180 req/min appliqué aux 10 endpoints authentifiés (key = user.sub).
- **Dashboard — devoirs débordent dans Notes** : layout restructuré (Aujourd'hui → Vue d'ensemble → Forces/faiblesses → Notes → Devoirs → Simulateur), chaque section pleine largeur.
- **Dashboard — EmptyState "Aucune matière"** : affiche nom de la période + bouton "Voir les autres périodes".
- **Simulateur fragile** : reset `subjectIdx` si changement de données, info-bulle si pas de coefficients.

### ✨ Added
- **Landing mockup bento** : aperçu visuel du dashboard (4 cartes : Moyenne 14,6, Aujourd'hui 3 cours, Prochains devoirs 3 entrées, Notes par matière 4 lignes) — responsive 3→2→1 colonnes.
- **Vue d'ensemble enrichie** : 3 colonnes (moyenne / classe / matières+notes) au lieu d'un seul gros chiffre.
- **Tab Observations dans Vie scolaire** : 4 types mappés (Carnet, Parents, Encouragement, Autre) avec pastille couleur.
- **Notifications shouldParentsJustify** : badge rouge "Justificatif parental requis".
- **Filtrage dates absences** : range startDate→endDate ("15–17 mars 2026" ou "15 mars → 4 avril 2026").
- **.env.example** complet : `PORT`, `NODE_ENV`, `JWT_SECRET`, `ENCRYPTION_KEY`, `TOKEN_TTL`, `DEVICE_UUID`, `CORS_ORIGIN`, `CORS_CREDENTIALS`.
- **Mobile menu — Paramètres** : section séparée dans le drawer mobile.

### 🔧 Refactored
- **Dashboard** : réécrit avec hiérarchie visuelle claire, plus de débordements, simulateur + empty states robustes.
- **Landing** : retrait du bouton "Code source" (anti-bug user-reported), ajout mockup bento, padding/typo affinés.
- **Header** : NavLink "Paramètres" retirée, intégrée au user menu (avatar + chevron) avec click-outside, ESC, ARIA `menu`/`menuitem`.
- **Server security** : `resolveSecret()` helper, validation `JWT_SECRET`/`ENCRYPTION_KEY` (min 32 chars, throw en prod), CORS guard.
- **Vie scolaire utils** : `formatAbsenceDateRange()`, `isJustified` strict, totaux utilisent `minutesMissed`/`durationMinutes`.
- **useApiResource** : race conditions robustes (cancelled par closure locale + `fetcherRef`, reset `error`/`loading` sur `skip`).
- **Hooks.js** : `fetcherRef.current` pour ne pas ré-encapsuler le fetcher dans les deps (stabilité).
- **Misc.js** : 7 fonctions inutilisées supprimées (`safeNumber`, `sortBy`, `uniqueBy`, `safeJSONParse`, `isMobileViewport`, `prefersReducedMotion`, `copyToClipboard`, `clamp`).
- **Timetable.js** : 4 helpers inutilisés supprimés (`getDayLabelsShort`, `getMonthLabels`, `isPastDay`, `getLessonTimeRange`).
- **CSS `<style>` JSX retirés** : Header → `index.css` (statique), Messaging → data-attribute `[data-selected]` + CSS (clean, pas de template literal React).

### 🛡️ Security
- `JWT_SECRET` ≥ 32 chars obligatoire en production.
- `ENCRYPTION_KEY` séparé du `JWT_SECRET` (indépendant cryptographiquement).
- CORS : opt-in pour credentials, refuse `*`+credentials.
- Rate-limit : 180 req/min/user sur tous les endpoints authentifiés + 20 tentatives/15min sur login.
- Helmet CSP : default-src 'self', frame-ancestors 'none', etc.

## [0.3.0] - 2026-06-04

### ✨ Added
- **Module Vie scolaire** : absences (justifiées/injustifiées), retards, sanctions, observations — groupés par date, avec statcards récap.
- **Module Messagerie** : liste de discussions, recherche, conversation, envoi (`Ctrl/Cmd+Enter`), marquage local "lu" + appel API `markRead`.
- **Page Paramètres** : compte, apparence (thème auto/clair/sombre), toggles d'affichage (moyenne de classe, ecart vs classe), confidentialité, reset, logout, à-propos.
- **Dashboard repensé** : stats cards (moyenne générale, comparaison classe, dernière sync), bloc "Aujourd'hui" (mini EDT), bloc "Prochains devoirs", bloc "Forces & faiblesses", simulateur corrigé.
- **Détail par matière** : moyenne, min/max, TrendChart, tableau de toutes les notes avec comparaison classe.
- **Système de Toasts** : notifications non-intrusives (succès, erreur, info, warning) avec auto-dismiss et animations.
- **Système de Modals** : `Modal` + `ConfirmModal` accessibles (focus trap, ESC, click outside).
- **Tabs réutilisables** : composant `Tabs` avec indicator animé.
- **SubjectAvatar** : pastilles colorées par matière (génération HSL déterministe).
- **Theme system/light/dark** : préférence persistée, suit `prefers-color-scheme` si "system".
- **Préférences utilisateur** : persistées en `localStorage` (`pronoteplus-prefs`), toggle de "reduce motion" global.
- **useApiAuth / useApiResource** : hooks mutualisés pour l'authentification et le chargement API (loading, error, refetch).
- **API étendue** : `fetchVieScolaire`, `fetchDiscussions`, `fetchDiscussionMessages`, `sendDiscussionMessage`, `markDiscussionRead`, `pingHealth`.
- **Endpoints serveur** : `/api/vie-scolaire`, `/api/discussions`, `/api/discussions/:id/messages` (GET + POST), `/api/discussions/:id/read` — avec fallbacks propres si l'API Pawnote ne les expose pas.
- **Nouveaux icônes** : Mail, Settings, Bell, School, Shield, ArrowUp/Down/Left/Right, ChevronDown/Right, Filter, Search, Sparkles, Trophy, Skull, Send, Inbox.
- **Responsive EDT & Cards** : media queries pour grille EDT, devoirs, vie scolaire, messagerie.
- **Bloc "Sécurité"** sur la Landing : message explicite sur le chiffrement AES-256-GCM et l'auto-hébergement.

### 🔧 Refactored
- **AppContext** réécrit : state consolidé (`token`, `user`, `themePref`, `prefs`, `toasts`), actions propres (`login`, `logout`, `addToast`, `dismissToast`, `updatePrefs`, `setUser`), persistance `localStorage`, cleanup des listeners.
- **API service** réécrit : `ApiError` exporté, retry-friendly, helper `qs()`, messages d'erreur FR cohérents, gestion network.
- **Header** refondu : menu mobile accessible (toggle, ESC, focus reset), NavLinks typés, modal de confirmation de logout.
- **Timetable** : grille 7h→20h au lieu de positionnement pixels, navigation semaine, toggle week-end, modal détail accessible, états `cancelled/exempted/detention/test`.
- **Homeworks** : recherche, filtre par matière, tabs upcoming/past/done/all, groupage par date, badges DS/Fait, indicateur retard.
- **Utils** : ajout `misc.js` (classNames, groupBy, sortBy, uniqueBy, safeJSONParse, isMobileViewport, prefersReducedMotion, copyToClipboard), `timetable.js` (getMondayOf, getDayLabels, isSameDay, isToday, getWeekDays, shiftWeek, groupLessonsByDay, lessonColorFromSubject, formatWeekRange), `vie-scolaire.js` (formatters, compteurs, groupage).
- **format.js** étendu : `formatTimeRange`, `formatBytes`, `safeFileName`, `formatRelative` gère minutes/heures.
- **Index CSS** : ajout de classes `.reduce-motion`, `.tt-grid/.tt-day-header/.tt-hour-cell/.tt-slot/.tt-lesson` (variants), `.hw-card/.hw-file`, responsive @media.
- **Pages** : `Dashboard`, `Timetable`, `Homeworks`, `VieScolaire`, `Messaging`, `Settings`, `Landing` modernisées avec le nouveau design system.

### 🐛 Fixed
- **`index.html`** : `apple-touch-icon` pointait vers `.png` inexistant → corrigé en `.svg`.
- **`getMonday`** mutait la date d'entrée → retourne maintenant un nouveau `Date` (lundi 00:00).
- **`pnpm-workspace.yaml`** parasite supprimé.
- **Vite config** : ajout `base: './'` (compatibilité self-hosting), `target: 'es2020'`, `cssCodeSplit`, `host: true`, `secure: false` sur le proxy, `preview.port`.
- **Dynamic import warning** dans `Messaging.jsx` : `sendDiscussionMessage` est maintenant statiquement importé.
- **Race condition au logout** : cleanup du menu mobile, focus reset.
- **`useApiResource`** : skip pendant loading évite les fetches concurrents.

### 🔒 Security
- Mots de passe Pronote chiffrés en AES-256-GCM côté serveur.
- Validation taille du message (<= 5000 chars) avant envoi.
- Validation `kind` côté serveur conservée.
- Helmet + rate-limit + CSP inchangés depuis 0.2.0.

### ⚡ Performance
- `useApiResource` évite la duplication loading/error/retry dans 6 pages.
- Code splitting conservé (CSS séparé, JS monolithique 280 kB / 83 kB gzip).
- Vite tree-shaking préservé.

### 📚 Infrastructure
- `package.json` bumped à `0.3.0`.
- README & landing à jour avec les nouveaux modules.
- `AUDIT_REPORT.md` documentant l'audit complet.

## [0.2.0] - 2026-06-03

### ✨ Added
- **Emploi du temps** : vue hebdomadaire des cours via `/api/timetable`
- **Devoirs à venir** : liste des devoirs sur 14 jours via `/api/homeworks`
- Page **Détail par matière** avec graphique d'évolution et liste des notes
- **Sélecteur de profil** sur la page de login (élève / parent / prof)
- Bouton **afficher/masquer** le mot de passe
- Bouton **déconnexion** dans le dashboard
- Bouton **rafraîchir** les données
- Indicateur **dernière synchronisation**
- **PWA** : manifest + meta tags pour installation sur mobile
- **Splash screen** avec détection du thème système
- **Bouton d'aide** pour trouver l'URL de son établissement Pronote

### 🐛 Fixed
- **Landing page cassée** : utilisait des classes Tailwind inexistantes — réécrite avec le design system EDP (CSS variables)
- **Session stockait le mot de passe en clair** : maintenant chiffré en AES-256-GCM, déchiffré uniquement côté serveur
- **Formule du simulateur incorrecte** : ajout d'un input pour le coefficient de la nouvelle note, math corrigée (somme pondérée par coefficient de la note, pas de la matière)
- **AppContext incohérent** : suppression de toute la logique locale (ADD_SUBJECT, etc.) qui contredisait l'architecture "connecté à Pronote"
- **Theme toggle instable** : ne lit plus le DOM, utilise l'état React
- **Race condition au mount** : ajout de guards pour éviter les fetches en double
- **Version "v0.1" partout** : bumpée à "v0.2"
- **Erreurs non gérées** : messages d'erreur plus clairs en français
- **Pas de gestion de session expirée** : auto-redirect vers /login si le serveur renvoie 401
- **Loading state** : ajout de skeletons au lieu d'un simple "Chargement..."

### 🔒 Security
- Mots de passe chiffrés en AES-256-GCM côté serveur
- Rate-limit sur `/api/auth/login` (20 / 15 min)
- Helmet activé en production (CSP, HSTS, frame-ancestors, etc.)
- CORS configurable (was `*` by default)
- JWT_SECRET obligatoire en production (throw si absent)
- Validation stricte des inputs (URL, longueur, kind)
- `x-powered-by` désactivé

### ⚡ Performance
- Compression gzip des réponses
- Cache statique des assets (1h)
- Fix du bug de re-fetch au changement de période

### 📚 Infrastructure
- Railway config (`railway.json`, `nixpacks.toml`, `Procfile`)
- `.env.example` ajouté
- `concurrently` ajouté pour le dev (`npm run dev`)
- README complet avec guide de déploiement

## [0.1.0] - 2026-06-01

- Première version connectée à Pronote via Pawnote
- Login + récupération des notes + dashboard basique
- API Express simple avec JWT
- Pas d'emploi du temps, pas de devoirs
- Pas de PWA, pas de déploiement configuré
