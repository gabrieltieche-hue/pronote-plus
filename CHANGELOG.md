# Changelog

Toutes les modifications notables de Pronote+ sont documentées ici.

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
- **JWT stockait le mot de passe en clair** : maintenant chiffré en AES-256-GCM, déchiffré uniquement côté serveur
- **Formule du simulateur incorrecte** : ajout d'un input pour le coefficient de la nouvelle note, math corrigée (somme pondérée par coefficient de la note, pas de la matière)
- **AppContext incohérent** : suppression de toute la logique locale (ADD_SUBJECT, etc.) qui contredisait l'architecture "connecté à Pronote"
- **Theme toggle instable** : ne lit plus le DOM, utilise l'état React
- **Race condition au mount** : ajout de guards pour éviter les fetches en double
- **Version "v0.1" partout** : bumpée à "v0.2"
- **Erreurs non gérées** : messages d'erreur plus clairs en français
- **Pas de gestion de session expirée** : auto-redirect vers /login si le serveur renvoie 401
- **Loading state** : ajout de skeletons au lieu d'un simple "Chargement..."

### 🔒 Security
- Mots de passe chiffrés en AES-256-GCM dans les JWT
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
