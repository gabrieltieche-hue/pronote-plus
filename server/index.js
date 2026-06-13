import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as pronote from 'pawnote';
import rateLimit from 'express-rate-limit';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
function resolveSecret(envVar, isProduction, label) {
  const value = process.env[envVar];
  if (value && value.length >= 32) return value;
  if (isProduction) {
    throw new Error(`${envVar} is required in production (min 32 chars)`);
  }
  const generated = crypto.randomBytes(48).toString('hex');
  console.warn(`[${label}] ${envVar} not set — generated a random ephemeral key. Sessions will not survive a restart.`);
  return generated;
}
const JWT_SECRET = resolveSecret('JWT_SECRET', NODE_ENV === 'production', 'jwt');
const ENCRYPTION_KEY = resolveSecret('ENCRYPTION_KEY', NODE_ENV === 'production', 'encryption');
const DEVICE_UUID = process.env.DEVICE_UUID || 'pronote-plus-server-v1';
const TOKEN_TTL = process.env.TOKEN_TTL || '7d';
const AES_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'connect-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'script-src': ["'self'", "'unsafe-inline'"],
      'frame-ancestors': ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : null;

if (NODE_ENV === 'production' && !allowedOrigins) {
  console.warn('[cors] CORS_ORIGIN not set in production — only same-origin requests will be allowed.');
}

if (allowedOrigins?.includes('*') && process.env.CORS_CREDENTIALS) {
  throw new Error('CORS_ORIGIN=* cannot be combined with CORS_CREDENTIALS');
}

app.use((req, res, next) => {
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const sameOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin === sameOrigin) return cb(null, true);
      if (!allowedOrigins || allowedOrigins.length === 0) {
        if (NODE_ENV !== 'production') return cb(null, true);
        return cb(new Error('CORS not allowed'));
      }
      if (allowedOrigins.includes('*') && NODE_ENV !== 'production') return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'));
    },
    credentials: !!process.env.CORS_CREDENTIALS,
  })(req, res, next);
});

app.use(express.json({ limit: '1mb' }));

const clientDistPath = join(__dirname, '..', 'dist');
app.use(express.static(clientDistPath, { maxAge: '1h', index: false }));

const kindMap = {
  student: pronote.AccountKind.STUDENT,
  parent: pronote.AccountKind.PARENT,
  teacher: pronote.AccountKind.TEACHER,
};

function toDateString(d) {
  if (!d) return null;
  try {
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d);
  } catch {
    return null;
  }
}

function isPrivateAddress(address) {
  if (!address) return true;
  address = String(address).toLowerCase();
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') return true;
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
  if (address.startsWith('::ffff:')) address = address.slice(7);
  const parts = address.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p))) return false;
  const [a, b] = parts;
  return a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127);
}

async function validatePronoteUrl(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 256) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    if (!u.hostname || u.username || u.password) return false;
    const hostname = u.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) return false;
    if (isIP(hostname) && isPrivateAddress(hostname)) return false;
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length) return false;
    return records.every((record) => !isPrivateAddress(record.address));
  } catch {
    return false;
  }
}

function boundedDateRange(req, fallbackDays, maxDays) {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date();
  const to = req.query.to ? new Date(String(req.query.to)) : new Date(from.getTime() + fallbackDays * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return { error: 'Paramètres de dates invalides' };
  }
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days > maxDays) {
    return { error: `Période trop large (${maxDays} jours maximum)` };
  }
  return { from, to };
}

function normalizeFileUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.href;
  } catch {
    return null;
  }
}

function normalizeFile(file, fallbackName = 'Fichier') {
  if (!file) return null;
  return {
    id: file.id || null,
    name: file.name || file.filename || fallbackName,
    url: normalizeFileUrl(file.url || file.href || file.downloadUrl),
    mime: file.mime || file.type || file.contentType || null,
    size: typeof file.size === 'number' ? file.size : null,
    kind: file.kind || null,
  };
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value || ''), 'utf8'),
    cipher.final(),
  ]);
  return {
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    data: encrypted.toString('base64url'),
  };
}

function decryptSecret(payload) {
  if (!payload?.iv || !payload?.tag || !payload?.data) {
    throw new Error('Invalid encrypted secret payload');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, Buffer.from(payload.iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

async function createSession(url, username, password, kind) {
  const session = pronote.createSessionHandle();
  await pronote.loginCredentials(session, {
    url,
    username,
    password,
    kind: kindMap[kind],
    deviceUUID: DEVICE_UUID,
  });
  return session;
}

const sessionCache = new Map();
const SESSION_TTL_MS = 5 * 60 * 1000;
const authSessions = new Map();
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Cache des discussions Pawnote par user (clé = userKey)
// INDISPENSABLE: les objets Discussion de Pawnote sont mutables et stateful.
// On doit passer la MÊME instance à discussionMessages / discussionCreateDraft / discussionRead
// sinon la lib crash (s.possessions, s.cache, etc. undefined).
const discussionsCache = new Map();
const DISC_CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedSession(key) {
  const cached = sessionCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.lastUsed > SESSION_TTL_MS) {
    sessionCache.delete(key);
    return null;
  }
  return cached;
}

function setCachedSession(key, session) {
  sessionCache.set(key, { session, lastUsed: Date.now() });
  if (sessionCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of sessionCache.entries()) {
      if (now - v.lastUsed > SESSION_TTL_MS) sessionCache.delete(k);
    }
  }
}

function invalidateSession(key) {
  sessionCache.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessionCache.entries()) {
    if (now - v.lastUsed > SESSION_TTL_MS) sessionCache.delete(k);
  }
  for (const [id, v] of authSessions.entries()) {
    if (now - v.lastUsed > AUTH_SESSION_TTL_MS) authSessions.delete(id);
  }
}, 60 * 1000).unref?.();

function createAuthSession(params, resource) {
  const id = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  authSessions.set(id, {
    id,
    url: params.url,
    username: params.username,
    encryptedPassword: encryptSecret(params.password),
    kind: params.kind,
    sub: resource.id || `${params.url}::${params.username}::${params.kind}`,
    lastUsed: now,
    createdAt: now,
  });
  if (authSessions.size > 1000) {
    const oldest = [...authSessions.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed).slice(0, authSessions.size - 1000);
    for (const [key] of oldest) authSessions.delete(key);
  }
  return id;
}

function getAuthSession(id) {
  const session = authSessions.get(id);
  if (!session) return null;
  if (Date.now() - session.lastUsed > AUTH_SESSION_TTL_MS) {
    authSessions.delete(id);
    return null;
  }
  session.lastUsed = Date.now();
  try {
    return {
      ...session,
      password: decryptSecret(session.encryptedPassword),
    };
  } catch {
    authSessions.delete(id);
    return null;
  }
}

function credentialFingerprint(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('base64url').slice(0, 18);
}

function cacheKey({ url, username, kind, password }) {
  return `${url}::${username}::${kind}::${credentialFingerprint(password)}`;
}

async function getOrCreateSession(_req, params) {
  const key = cacheKey(params);
  const cached = getCachedSession(key);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.session;
  }
  const session = await createSession(params.url, params.username, params.password, params.kind);
  setCachedSession(key, session);
  return session;
}

function invalidateUserSession(req) {
  if (!req.user?.url || !req.user?.username) return;
  invalidateSession(cacheKey(req.user));
  discussionsCache.delete(discussionsCacheKey(req.user));
}

function discussionsCacheKey({ url, username, kind }) {
  return `${url}::${username}::${kind || 'unknown'}::discussions`;
}

function getUserDiscussionsCache(userKey) {
  const entry = discussionsCache.get(userKey);
  if (!entry) return null;
  if (Date.now() - entry.lastUsed > DISC_CACHE_TTL_MS) {
    discussionsCache.delete(userKey);
    return null;
  }
  return entry;
}

function setUserDiscussionsCache(userKey, map) {
  discussionsCache.set(userKey, { map, lastUsed: Date.now() });
  if (discussionsCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of discussionsCache.entries()) {
      if (now - v.lastUsed > DISC_CACHE_TTL_MS) discussionsCache.delete(k);
    }
  }
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isSessionError(err) {
  const name = err?.constructor?.name || '';
  const message = String(err?.message || err || '');
  return name === 'BadCredentialsError'
    || name === 'SessionExpiredError'
    || name === 'AuthenticateError'
    || message.includes('BadCredentialsError')
    || message.includes('SessionExpiredError')
    || message.includes('AuthenticateError');
}

function isRateLimitedError(err) {
  const message = String(err?.message || err || '');
  return err?.constructor?.name === 'RateLimitedError'
    || message.includes('RateLimitedError')
    || message.includes('rate-limited')
    || message.includes('rate limited');
}

function isBadCredentialsError(err) {
  const name = err?.constructor?.name || '';
  const message = String(err?.message || err || '');
  const fullStr = String(err || '');
  return name === 'BadCredentialsError'
    || fullStr.includes('BadCredentialsError')
    || message.toLowerCase().includes('identifiants')
    || message.toLowerCase().includes('credentials')
    || message.toLowerCase().includes('resolve the challenge');
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const authSession = payload.sid ? getAuthSession(payload.sid) : null;
    if (!authSession) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    req.user = authSession;
    req.authSessionId = payload.sid;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessaie dans une minute.' },
  keyGenerator: (req) => req.user?.sub || req.ip,
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.body || {};

    if (!url || !username || !password || !kind) {
      return res.status(400).json({ error: 'Champs requis manquants : url, username, password, kind' });
    }
    if (!(await validatePronoteUrl(url))) {
      return res.status(400).json({ error: 'URL Pronote invalide ou non autorisée. Utilise une URL HTTPS publique de ton établissement.' });
    }
    if (typeof username !== 'string' || username.length < 1 || username.length > 128) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }
    if (typeof password !== 'string' || password.length < 1 || password.length > 256) {
      return res.status(400).json({ error: 'Mot de passe invalide' });
    }
    if (!kindMap[kind]) {
      return res.status(400).json({ error: 'Type de compte invalide. Utilisez student, parent ou teacher' });
    }

    const session = await getOrCreateSession(null, { url, username, password, kind });
    const resource = session.userResource;

    const sid = createAuthSession({ url, username, password, kind }, resource);
    const token = jwt.sign({ sid }, JWT_SECRET, { expiresIn: TOKEN_TTL });

    res.json({
      token,
      user: {
        name: resource.name,
        class: resource.className || null,
        establishment: resource.establishmentName,
        kind,
      },
    });
  } catch (err) {
    if (isBadCredentialsError(err)) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    if (isRateLimitedError(err)) {
      return res.status(429).json({ error: 'Trop de tentatives auprès de Pronote. Réessaie dans quelques minutes.' });
    }
    const name = err?.constructor?.name || '';
    const message = String(err?.message || err || '');
    if (name === 'AuthenticateError' || message.includes('AuthenticateError')) {
      return res.status(401).json({ error: 'Authentification refusée par le serveur Pronote' });
    }
    if (name === 'AccessDeniedError' || message.includes('AccessDeniedError')) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (name === 'AccountDisabledError' || message.includes('AccountDisabledError')) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
      return res.status(502).json({ error: 'Impossible de contacter le serveur Pronote' });
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
      return res.status(504).json({ error: 'Le serveur Pronote a mis trop de temps à répondre' });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  if (req.authSessionId) authSessions.delete(req.authSessionId);
  invalidateUserSession(req);
  res.json({ ok: true });
});

app.get('/api/periods', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const gradesTab = session.userResource.tabs.get(pronote.TabLocation.Grades);

    if (!gradesTab) {
      return res.status(404).json({ error: 'Notes non disponibles pour ce compte' });
    }

    const periods = gradesTab.periods.map((p) => ({
      id: String(p.id),
      name: p.name,
      start: toDateString(p.startDate),
      end: toDateString(p.endDate),
    }));

    res.json({
      periods,
      defaultPeriodId: gradesTab.defaultPeriod ? String(gradesTab.defaultPeriod.id) : (periods[0]?.id || null),
    });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Periods error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des périodes' });
  }
});

app.get('/api/grades', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const gradesTab = session.userResource.tabs.get(pronote.TabLocation.Grades);

    if (!gradesTab) {
      return res.status(404).json({ error: 'Notes non disponibles pour ce compte' });
    }

    const requestedPeriodId = req.query.periodId ? String(req.query.periodId) : null;

    const stripPrefix = (id) => {
      if (typeof id !== 'string') return String(id);
      return id.replace(/^\d+#/, '');
    };

    let period = null;
    if (requestedPeriodId) {
      period = gradesTab.periods.find((p) => String(p.id) === requestedPeriodId)
        || gradesTab.periods.find((p) => stripPrefix(p.id) === stripPrefix(requestedPeriodId))
        || gradesTab.periods.find((p) => stripPrefix(p.id) === requestedPeriodId)
        || gradesTab.periods.find((p) => String(p.id) === stripPrefix(requestedPeriodId));
    } else {
      period = gradesTab.defaultPeriod || gradesTab.periods[0];
    }

    if (!period) {
      console.error('[grades] Period not found. Received:', requestedPeriodId, 'Available:', gradesTab.periods.map((p) => p.id));
      return res.status(404).json({ error: 'Période non trouvée' });
    }

    const overview = await pronote.gradesOverview(session, period).catch(() => null);
    if (!overview) {
      return res.status(500).json({ error: 'Impossible de récupérer les notes depuis Pronote' });
    }

    let coefMap = {};
    try {
      const gradebookData = await pronote.gradebook(session, period);
      if (gradebookData?.subjects) {
        for (const subject of gradebookData.subjects) {
          if (subject?.subject?.name) {
            coefMap[subject.subject.name] = subject.coef ?? coefMap[subject.subject.name];
          }
        }
      }
    } catch (e) {
      try {
        const gradebookTab = session.userResource.tabs.get(pronote.TabLocation.Gradebook);
        if (gradebookTab) {
          const gbPeriod = gradebookTab.defaultPeriod || gradebookTab.periods?.[0];
          if (gbPeriod && (!requestedPeriodId || String(gbPeriod.id) !== String(period.id))) {
            const gbData = await pronote.gradebook(session, gbPeriod);
            if (gbData?.subjects) {
              for (const subject of gbData.subjects) {
                if (subject?.subject?.name) {
                  coefMap[subject.subject.name] = subject.coef ?? coefMap[subject.subject.name];
                }
              }
            }
          }
        }
      } catch {
        for (const g of (overview.grades || [])) {
          const s = g?.subject?.name;
          if (s && g.coefficient > 0 && coefMap[s] == null) {
            coefMap[s] = g.coefficient;
          }
        }
      }
    }

    const gradesBySubject = {};
    if (overview.grades) {
      for (const grade of overview.grades) {
        const subjectName = grade?.subject?.name;
        if (!subjectName) continue;
        if (!gradesBySubject[subjectName]) gradesBySubject[subjectName] = [];
        const val = grade.value && typeof grade.value.points === 'number' ? grade.value.points : null;
        const outOf = grade.outOf && typeof grade.outOf.points === 'number' ? grade.outOf.points : 20;
        const isValid = val !== null && Number.isFinite(val);
        if (!isValid && !grade.comment) continue;
        gradesBySubject[subjectName].push({
          value: isValid ? val : null,
          outOf,
          coefficient: grade.coefficient || 1,
          name: grade.comment || '',
          date: toDateString(grade.date),
          classAverage: grade.average?.points ?? null,
          max: grade.max?.points ?? null,
          min: grade.min?.points ?? null,
        });
      }
    }

    const overallAvg = overview.overallAverage?.points ?? null;
    const classAvg = overview.classAverage?.points ?? null;

    const subjects = (overview.subjectsAverages || []).map((sa) => {
      const subjectName = sa?.subject?.name;
      const grades = gradesBySubject[subjectName] || [];
      const rawCoeff = coefMap[subjectName];
      let coeff = rawCoeff != null ? rawCoeff : null;
      if (coeff == null && grades.length > 0) coeff = 1;
      return {
        name: subjectName,
        coefficient: coeff,
        studentAverage: sa.student?.points ?? sa.studentAverage?.points ?? sa.average?.points ?? null,
        classAverage: sa.class_average?.points ?? sa.classAverage?.points ?? null,
        maxAverage: sa.max?.points ?? null,
        minAverage: sa.min?.points ?? null,
        grades,
      };
    });

    res.json({
      overallAverage: overallAvg,
      classAverage: classAvg,
      period: {
        id: String(period.id),
        name: period.name,
        start: toDateString(period.startDate),
        end: toDateString(period.endDate),
      },
      subjects,
    });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Grades error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes' });
  }
});

app.get('/api/user', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const resource = session.userResource;

    res.json({
      name: resource.name,
      class: resource.className || null,
      establishment: resource.establishmentName,
      kind,
    });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('User info error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations utilisateur' });
  }
});

app.get('/api/timetable', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });

    const allowedTabs = session.user?.authorizations?.tabs || [];
    if (!allowedTabs.includes(pronote.TabLocation.Timetable)) {
      return res.status(404).json({ error: 'Emploi du temps non disponible pour ce compte' });
    }

    const range = boundedDateRange(req, 7, 31);
    if (range.error) return res.status(400).json({ error: range.error });
    const { from, to } = range;

    const data = await pronote.timetableFromIntervals(session, from, to).catch((e) => {
      console.error('[timetable] Pawnote error:', e);
      return null;
    });

    if (!data) {
      return res.json({ lessons: [], from: from.toISOString(), to: to.toISOString() });
    }

    // IMPORTANT: parseTimetable est INDISPENSABLE après timetableFromIntervals
    // pour résoudre les références internes (cours annulés, planifiés, etc.)
    try {
      pronote.parseTimetable(session, data, {
        withCanceledClasses: true,
        withPlannedClasses: true,
        withSuperposedCanceledClasses: true,
      });
    } catch (e) {
      console.warn('[timetable] parseTimetable warn:', e?.message || e);
    }

    if (!Array.isArray(data.classes) || data.classes.length === 0) {
      return res.json({ lessons: [], from: from.toISOString(), to: to.toISOString() });
    }

    const lessons = data.classes.map((c) => {
      const isLesson = c.is === 'lesson';
      return {
        id: c.id,
        subject: isLesson ? (c.subject?.name || 'Cours') : (c.title || (c.is === 'detention' ? 'Retenue' : 'Activité')),
        teacher: c.teacherNames?.[0] || null,
        classroom: c.classrooms?.[0] || null,
        start: c.startDate instanceof Date ? c.startDate.toISOString() : null,
        end: c.endDate instanceof Date ? c.endDate.toISOString() : null,
        groupName: isLesson ? (c.groupNames?.[0] || null) : null,
        isCancelled: isLesson ? !!c.canceled : false,
        isDetention: c.is === 'detention',
        isExempted: isLesson ? !!c.exempted : false,
        isTest: isLesson ? !!c.test : false,
        kind: c.is,
        // Pour les cours annulés on garde l'info dans une note
        status: c.canceled ? 'cancelled' : (c.exempted ? 'exempted' : 'normal'),
      };
    }).filter((l) => l.start && l.end); // on enlève les entries mal formées

    res.json({ lessons, from: from.toISOString(), to: to.toISOString() });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Timetable error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'emploi du temps' });
  }
});

app.get('/api/homeworks', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });

    const allowedTabs = session.user?.authorizations?.tabs || [];
    if (!allowedTabs.includes(pronote.TabLocation.Assignments)) {
      return res.status(404).json({ error: 'Devoirs non disponibles pour ce compte' });
    }

    const range = boundedDateRange(req, 14, 120);
    if (range.error) return res.status(400).json({ error: range.error });
    const { from, to } = range;

    const assignments = await pronote.assignmentsFromIntervals(session, from, to).catch((e) => {
      console.error('[homeworks] Pawnote error:', e);
      return null;
    });

    if (!assignments || !Array.isArray(assignments)) {
      return res.json({ homeworks: [], from: from.toISOString(), to: to.toISOString() });
    }

    const homeworks = assignments.map((h) => ({
      id: h.id,
      subject: h.subject?.name || 'Inconnu',
      description: stripHtml(h.description || '').trim(),
      forDate: h.deadline instanceof Date ? h.deadline.toISOString() : (h.deadline || null),
      done: !!h.done,
      files: (h.attachments || []).map((a) => normalizeFile(a)).filter(Boolean),
    }));

    res.json({ homeworks, from: from.toISOString(), to: to.toISOString() });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Homeworks error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des devoirs' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '0.3.2' });
});

app.get('/api/vie-scolaire', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });

    const allowedTabs = session.user?.authorizations?.tabs || [];

    const result = { absences: [], delays: [], punishments: [], observations: [] };

    if (allowedTabs.includes(pronote.TabLocation.Notebook)) {
      try {
        const periods = session.userResource.tabs.get(pronote.TabLocation.Notebook)?.periods;
        if (periods && periods.length > 0) {
          const defaultPeriod = session.userResource.tabs.get(pronote.TabLocation.Notebook).defaultPeriod || periods[0];
          const notebook = await pronote.notebook(session, defaultPeriod).catch((e) => {
            console.error('[vie-scolaire] notebook error:', e?.message || e);
            return null;
          });
          if (notebook) {
            const absences = Array.isArray(notebook.absences) ? notebook.absences : [];
            const delays = Array.isArray(notebook.delays) ? notebook.delays : [];
            const punishments = Array.isArray(notebook.punishments) ? notebook.punishments : [];
            const observations = Array.isArray(notebook.observations) ? notebook.observations : [];
            const precautionary = Array.isArray(notebook.precautionaryMeasures) ? notebook.precautionaryMeasures : [];

            const normAbs = absences.map((a, i) => ({
              id: a.id || `abs-${i}`,
              startDate: a.startDate instanceof Date ? a.startDate.toISOString() : null,
              endDate: a.endDate instanceof Date ? a.endDate.toISOString() : null,
              justified: !!a.justified,
              opened: !!a.opened,
              daysMissed: typeof a.daysMissed === 'number' ? a.daysMissed : 0,
              hoursMissed: typeof a.hoursMissed === 'number' ? a.hoursMissed : 0,
              minutesMissed: typeof a.minutesMissed === 'number' ? a.minutesMissed : 0,
              reason: a.reason || null,
              isReasonUnknown: !!a.isReasonUnknown,
              shouldParentsJustify: !!a.shouldParentsJustify,
            }));
            const normDel = delays.map((d, i) => ({
              id: d.id || `del-${i}`,
              date: toDateString(d.date),
              minutes: typeof d.minutes === 'number' ? d.minutes : 0,
              justified: !!d.justified,
              justification: d.justification || null,
              reason: d.reason || null,
              isReasonUnknown: !!d.isReasonUnknown,
              shouldParentsJustify: !!d.shouldParentsJustify,
            }));
            const normPun = punishments.map((p, i) => ({
              id: p.id || `pun-${i}`,
              date: p.dateGiven instanceof Date ? toDateString(p.dateGiven) : null,
              title: p.title || 'Sanction',
              giver: p.giver || null,
              durationMinutes: typeof p.durationMinutes === 'number' ? p.durationMinutes : 0,
              circumstances: p.circumstances || null,
              workToDo: p.workToDo || null,
              reasons: Array.isArray(p.reasons) ? p.reasons : [],
              exclusion: !!p.exclusion,
              isDuringLesson: !!p.isDuringLesson,
            }));
            const normObs = observations.map((o, i) => ({
              id: o.id || `obs-${i}`,
              date: toDateString(o.date),
              name: o.name || null,
              kind: typeof o.kind === 'number' ? o.kind : null,
              subject: o.subject?.name || null,
              reason: o.reason || null,
              opened: !!o.opened,
              shouldParentsJustify: !!o.shouldParentsJustify,
            }));
            const normPrec = precautionary.map((p, i) => ({
              id: p.id || `prec-${i}`,
              title: p.title || null,
              comments: p.comments || null,
              reasons: Array.isArray(p.reasons) ? p.reasons : [],
              exclusion: !!p.exclusion,
              circumstances: p.circumstances || null,
              giver: p.giver || null,
              decisionMaker: p.decisionMaker || null,
              dateGiven: p.dateGiven instanceof Date ? toDateString(p.dateGiven) : null,
              startDate: p.startDate instanceof Date ? p.startDate.toISOString() : null,
              endDate: p.endDate instanceof Date ? p.endDate.toISOString() : null,
            }));

            result.absences = normAbs;
            result.delays = normDel;
            result.punishments = normPun;
            result.observations = normObs;
            result.precautionaryMeasures = normPrec;
          }
        }
      } catch (e) {
        console.error('[vie-scolaire] Error:', e);
      }
    }

    res.json(result);
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Vie scolaire error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la vie scolaire' });
  }
});

app.get('/api/discussions', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const userKey = discussionsCacheKey({ url, username, kind });

    const allowedTabs = session.user?.authorizations?.tabs || [];
    if (!allowedTabs.includes(pronote.TabLocation.Discussions)) {
      return res.json([]);
    }
    if (session.user?.authorizations?.canReadDiscussions === false) {
      return res.json([]);
    }

    // Récupère la cache existante (objets Discussion mutables) OU la rebuild
    let cached = getUserDiscussionsCache(userKey);
    let discussionsByRef = cached?.map;

    if (!discussionsByRef) {
      const data = await pronote.discussions(session).catch((e) => {
        console.error('[discussions] error:', e?.message || e);
        return null;
      });
      if (!data || !Array.isArray(data.items)) {
        return res.json([]);
      }
      discussionsByRef = new Map();
      for (const item of data.items) {
        if (item && item.participantsMessageID) {
          discussionsByRef.set(String(item.participantsMessageID), item);
        }
      }
      setUserDiscussionsCache(userKey, discussionsByRef);
    } else {
      cached.lastUsed = Date.now();
    }

    const list = [];
    for (const [id, item] of discussionsByRef.entries()) {
      list.push({
        id,
        subject: item.subject || item.recipientName || null,
        participants: item.recipientName ? [{ id: null, name: item.recipientName }] : [],
        unread: Number(item.numberOfMessagesUnread || 0) > 0,
        preview: stripHtml(item.messages?.sents?.[item.messages.sents.length - 1]?.content || '').slice(0, 200),
        lastMessageDate: item.messages?.sents?.[item.messages.sents.length - 1]?.creationDate instanceof Date
          ? item.messages.sents[item.messages.sents.length - 1].creationDate.toISOString()
          : (item.date instanceof Date ? item.date.toISOString() : null),
        numberOfMessages: item.numberOfMessages || 0,
        closed: !!item.closed,
      });
    }
    list.sort((a, b) => {
      const da = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
      const db = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
      return db - da;
    });
    res.json(list);
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Discussions error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des discussions' });
  }
});

app.get('/api/discussions/:id/messages', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const userKey = discussionsCacheKey({ url, username, kind });
    const discussionId = String(req.params.id);

    const cached = getUserDiscussionsCache(userKey);
    const discussion = cached?.map?.get(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion introuvable (cache expirée, rafraîchis la liste)' });
    }

    let data;
    try {
      data = await pronote.discussionMessages(session, discussion, true);
    } catch (e) {
      console.error('[discussionMessages] error:', e?.message || e);
      return res.status(502).json({ error: 'Impossible de charger les messages' });
    }
    if (!data) return res.json({ messages: [], defaultReplyMessageID: null, canIncludeStudentsAndParents: false });

    // data.sents (PAS data.messages qui n'existe pas)
    const sents = Array.isArray(data.sents) ? data.sents : [];
    const norm = sents.map((m) => {
      const authorObj = m.author;
      const authorName = typeof authorObj === 'string' ? authorObj : (authorObj?.name || null);
      return {
        id: m.id,
        content: m.content || '',
        author: authorName || 'Inconnu',
        fromMe: !m.author,
        date: m.creationDate instanceof Date ? m.creationDate.toISOString() : (m.creationDate ? new Date(m.creationDate).toISOString() : null),
        files: Array.isArray(m.files) ? m.files.map((f) => normalizeFile(f, 'fichier')).filter(Boolean) : [],
      };
    });
    norm.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
    res.json({
      messages: norm,
      defaultReplyMessageID: data.defaultReplyMessageID || null,
      canIncludeStudentsAndParents: !!data.canIncludeStudentsAndParents,
      sendAction: data.sendAction ?? null,
    });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Discussion messages error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

app.post('/api/discussions/:id/messages', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const userKey = discussionsCacheKey({ url, username, kind });
    const discussionId = String(req.params.id);
    const { content, replyTo } = req.body || {};
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message trop long (max 5000 caractères)' });
    }
    if (session.user?.authorizations?.canSendDiscussions === false) {
      return res.status(403).json({ error: 'Envoi non autorisé sur ce compte' });
    }

    const cached = getUserDiscussionsCache(userKey);
    const discussion = cached?.map?.get(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion introuvable (cache expirée, rafraîchis la liste)' });
    }

    // Pawnote 1.6+: discussionCreateDraft(session, discussion, content, replyTo?)
    // crée le brouillon ET envoie le message. Pas besoin de discussionSendDraft séparé.
    try {
      await pronote.discussionCreateDraft(session, discussion, content.trim(), replyTo || undefined);
    } catch (e) {
      console.error('[discussionCreateDraft] error:', e?.message || e);
      return res.status(502).json({ error: 'Envoi impossible' });
    }
    res.json({ ok: true });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

app.post('/api/discussions/:id/read', authenticate, apiLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await getOrCreateSession(req, { url, username, password, kind });
    const userKey = discussionsCacheKey({ url, username, kind });
    const discussionId = String(req.params.id);

    const cached = getUserDiscussionsCache(userKey);
    const discussion = cached?.map?.get(discussionId);
    if (!discussion) {
      // best-effort: 200 OK
      return res.json({ ok: true, warning: 'cache expired' });
    }
    try {
      await pronote.discussionRead(session, discussion);
    } catch (e) {
      // best-effort, ne pas échouer
      console.warn('[discussionRead] warn:', e?.message || e);
    }
    res.json({ ok: true });
  } catch (err) {
    if (isSessionError(err)) {
      invalidateUserSession(req);
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    res.status(500).json({ error: 'Erreur' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint introuvable' });
});

app.get('*', (_req, res) => {
  res.sendFile(join(clientDistPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'CORS not allowed') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

if (NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Pronote+ server v0.3.2 running on port ${PORT}`);
  });
}

export default app;

export const __test = NODE_ENV === 'test'
  ? {
      encryptSecret,
      decryptSecret,
      createAuthSession,
      getAuthSession,
      authSessions,
    }
  : undefined;
