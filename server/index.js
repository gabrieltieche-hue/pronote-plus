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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET is required in production'); })()
  : 'dev-only-not-for-production');
const DEVICE_UUID = process.env.DEVICE_UUID || 'pronote-plus-server-v1';
const TOKEN_TTL = process.env.TOKEN_TTL || '7d';
const PASSWORD_ENC_KEY = crypto
  .createHash('sha256')
  .update(JWT_SECRET)
  .digest();

function encryptPassword(password) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', PASSWORD_ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

function decryptPassword(blob) {
  if (!blob || typeof blob !== 'string') return null;
  const parts = blob.split('.');
  if (parts.length !== 3) return null;
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const enc = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', PASSWORD_ENC_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

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
      'script-src': ["'self'"],
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

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!allowedOrigins) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

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

function isValidUrl(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 256) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
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
    if (payload.ep) {
      payload.password = decryptPassword(payload.ep);
    }
    if (!payload.url || !payload.username || !payload.password || !payload.kind) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    req.user = payload;
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

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { url, username, password, kind } = req.body || {};

    if (!url || !username || !password || !kind) {
      return res.status(400).json({ error: 'Champs requis manquants : url, username, password, kind' });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'URL invalide' });
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

    const session = await createSession(url, username, password, kind);
    const resource = session.userResource;

    const token = jwt.sign(
      {
        url,
        username,
        ep: encryptPassword(password),
        kind,
        sub: resource.id || `${url}::${username}`,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

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

app.get('/api/periods', authenticate, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await createSession(url, username, password, kind);
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
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Periods error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des périodes' });
  }
});

app.get('/api/grades', authenticate, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await createSession(url, username, password, kind);
    const gradesTab = session.userResource.tabs.get(pronote.TabLocation.Grades);

    if (!gradesTab) {
      return res.status(404).json({ error: 'Notes non disponibles pour ce compte' });
    }

    const requestedPeriodId = req.query.periodId ? String(req.query.periodId) : null;
    const period = requestedPeriodId
      ? gradesTab.periods.find((p) => String(p.id) === requestedPeriodId)
      : gradesTab.defaultPeriod || gradesTab.periods[0];

    if (!period) {
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
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Grades error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes' });
  }
});

app.get('/api/user', authenticate, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await createSession(url, username, password, kind);
    const resource = session.userResource;

    res.json({
      name: resource.name,
      class: resource.className || null,
      establishment: resource.establishmentName,
      kind,
    });
  } catch (err) {
    if (isSessionError(err)) {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('User info error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations utilisateur' });
  }
});

app.get('/api/timetable', authenticate, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await createSession(url, username, password, kind);
    const timetableTab = session.userResource.tabs.get(pronote.TabLocation.Timetable);
    if (!timetableTab) {
      return res.status(404).json({ error: 'Emploi du temps non disponible pour ce compte' });
    }
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (isNaN(from) || isNaN(to) || to < from) {
      return res.status(400).json({ error: 'Paramètres de dates invalides' });
    }
    const lessons = await pronote.lessons(session, from, to).catch(() => []);
    const formatted = lessons.map((l) => ({
      id: l.id,
      subject: l.subject?.name || 'Inconnu',
      teacher: l.teacher?.name || null,
      classroom: l.classroom || null,
      start: l.startDate instanceof Date ? l.startDate.toISOString() : (l.startDate || null),
      end: l.endDate instanceof Date ? l.endDate.toISOString() : (l.endDate || null),
      groupName: l.groupName || null,
      isCancelled: !!l.isCancelled,
      isDetention: !!l.isDetention,
      isExempted: !!l.isExempted,
      isTest: !!l.isTest,
    }));
    res.json({ lessons: formatted, from: from.toISOString(), to: to.toISOString() });
  } catch (err) {
    if (isSessionError(err)) {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Timetable error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'emploi du temps' });
  }
});

app.get('/api/homeworks', authenticate, async (req, res) => {
  try {
    const { url, username, password, kind } = req.user;
    const session = await createSession(url, username, password, kind);
    const homeworkTab = session.userResource.tabs.get(pronote.TabLocation.Homework);
    if (!homeworkTab) {
      return res.status(404).json({ error: 'Devoirs non disponibles pour ce compte' });
    }
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (isNaN(from) || isNaN(to) || to < from) {
      return res.status(400).json({ error: 'Paramètres de dates invalides' });
    }
    const homeworks = await pronote.homeworks(session, from, to).catch(() => []);
    const formatted = homeworks.map((h) => ({
      id: h.id,
      subject: h.subject?.name || 'Inconnu',
      teacher: h.teacher?.name || null,
      description: h.description || '',
      forDate: h.forDate instanceof Date ? h.forDate.toISOString() : (h.forDate || null),
      done: !!h.done,
      files: (h.attachments || []).map((a) => ({
        id: a.id,
        name: a.name || 'Fichier',
        url: a.url || null,
      })),
    }));
    res.json({ homeworks: formatted, from: from.toISOString(), to: to.toISOString() });
  } catch (err) {
    if (isSessionError(err)) {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    console.error('Homeworks error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des devoirs' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '0.2.0' });
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
    console.log(`Pronote+ server v0.2.0 running on port ${PORT}`);
  });
}

export default app;
