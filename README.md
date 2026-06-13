# Pronote+

> L'interface augmentée de Pronote, libre et open-source.

Pronote+ se connecte à **ton vrai compte Pronote** (via la librairie [Pawnote](https://github.com/LiterateInk/Pawnote)) et te donne une vue moderne de tes notes, moyennes, emploi du temps et devoirs — sans pub, sans compte Pronote+ à créer, sans rien payer.

## Stack

- **Frontend** : React 18 + Vite 6 + Tailwind 3
- **Backend** : Node.js 18+ + Express 4 + Pawnote (reverse-engineered Pronote API)
- **Design** : Clone d'Ecole Directe Plus (CSS variables, Window system, badges de notes, dark/light)
- **Déploiement** : Railway / Render / Fly.io (gratuit)

## Démarrage local

```bash
# 1. Installer
npm install

# 2. Configurer le serveur
cp server/.env.example server/.env
# Édite server/.env et mets JWT_SECRET + ENCRYPTION_KEY (32+ caractères aléatoires)

# 3. Lancer en mode dev (client + serveur en parallèle)
npm run dev

# Le client est sur http://localhost:5173
# Le serveur est sur http://localhost:3001
```

## Build de production

```bash
npm run build      # build le frontend dans dist/
npm start          # lance le serveur (sert le dist/ statique)
```

## Déploiement sur Railway

1. Crée un nouveau service sur [Railway](https://railway.app) depuis ce repo
2. Railway détecte `railway.json` + `nixpacks.toml` automatiquement
3. Ajoute les variables d'environnement :
   - `JWT_SECRET` (obligatoire) — 64 caractères aléatoires
   - `ENCRYPTION_KEY` (obligatoire) — clé séparée pour chiffrer les secrets Pronote
   - `CORS_ORIGIN` — domaine de ton app, ex `https://pronote-plus.up.railway.app`
4. Railway te donne une URL publique. C'est tout.

## Fonctionnalités v0.3

- Connexion au vrai Pronote (élève / parent / prof)
- Import automatique des notes, moyennes, coefficients
- Sélecteur de période (trimestre/semestre)
- Moyenne générale + par matière + vs classe
- Simulateur « j'ai besoin de combien au prochain DS ? »
- Mode sombre / clair / auto (suit le système)
- **Emploi du temps de la semaine** (vue grille, navigation, détail des cours)
- **Liste des devoirs à venir** (recherche, filtre par matière, groupage par jour)
- **Vie scolaire** (absences, retards, sanctions, observations)
- **Messagerie** (lecture, envoi, marquage lu)
- **Paramètres** (apparence, confidentialité, reset)
- **Toasts / modals / tabs** accessibles
- API REST sécurisée (Helmet, rate-limit, CORS, JWT signé, mot de passe Pronote chiffré AES-256-GCM)

## Variables d'environnement

| Var              | Description                            | Défaut        |
|------------------|----------------------------------------|---------------|
| `PORT`           | Port d'écoute                          | `3001`        |
| `NODE_ENV`       | `production` / `development`           | `development` |
| `JWT_SECRET`     | Clé de signature des tokens (64+ char) | *obligatoire* |
| `ENCRYPTION_KEY` | Clé AES-256-GCM séparée                | *obligatoire en prod* |
| `CORS_ORIGIN`    | Origines autorisées (CSV)              | même origine en prod |
| `DEVICE_UUID`    | UUID device pour Pawnote               | server-v1     |
| `TOKEN_TTL`      | Durée de vie des tokens                | `7d`          |

## Sécurité

- Les mots de passe ne sont **jamais stockés en clair** : ils sont chiffrés avec AES-256-GCM dans le cache de session serveur
- Limite actuelle : le navigateur conserve un bearer token dans `localStorage`; la prochaine étape sécurité majeure est une session opaque ou un cookie `HttpOnly`
- Rate-limit sur `/api/auth/login` (20 tentatives / 15 min)
- Helmet (CSP, HSTS, etc.) en production
- CORS configurable, restrictif en production sans allowlist explicite
- URL Pronote validée en HTTPS public pour réduire les risques SSRF
- Aucune dépendance de tracking, aucune télémétrie

## Architecture

```
pronote-plus/
├── index.html              # Shell HTML + splash screen + PWA
├── public/                 # Assets statiques (manifest, icons, fonts)
├── server/
│   ├── index.js            # API Express + Pawnote
│   ├── .env.example        # Template des variables d'env
│   └── package.json
├── src/
│   ├── components/         # Composants UI réutilisables
│   ├── context/            # AppContext (theme, token, user)
│   ├── pages/              # Landing, Login, Dashboard, Timetable, Homeworks, VieScolaire, Messaging, Settings
│   ├── services/           # Client API
│   ├── utils/              # Helpers (grades, format, etc.)
│   ├── App.jsx             # Routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Design system (EDP)
├── tailwind.config.js
├── vite.config.js
├── railway.json
├── nixpacks.toml
└── Procfile
```

## Licence

MIT — fork libre d'inspiration [Ecole Directe Plus](https://github.com/Magic-Fishes/Ecole-Directe-Plus) (EDP), non-affilié à Index Éducation / Pronote.

## Avertissement

Pronote+ est un outil **non-officiel**, développé par un élève pour les élèves. Aucune affiliation avec Index Éducation, Pronote, ou tout autre service mentionné. Utilise-le à tes propres risques.
