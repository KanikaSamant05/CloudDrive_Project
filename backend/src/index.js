const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const helmet       = require('helmet');
require('dotenv').config();

const authRouter       = require('./routes/auth');
const foldersRouter    = require('./routes/folders');
const filesRouter      = require('./routes/files');
const sharesRouter     = require('./routes/shares');
const linkSharesRouter = require('./routes/linkShares');
const searchRouter     = require('./routes/search');
const starsRouter      = require('./routes/stars');
const recentRouter     = require('./routes/recent');
const activitiesRouter = require('./routes/activities');
const { startPurgeJob } = require('./jobs/purgeTrash');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Rate Limiters ─────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs:        5 * 60 * 1000,
  max:             100,
  message:         { error: { message: 'Too many requests, please slow down' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  message:         { error: { message: 'Too many login attempts, try again later' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

const uploadLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  message:         { error: { message: 'Too many uploads, please wait' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Security Headers ── must be BEFORE everything else ────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy:     false,
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy',        'no-referrer');
  next();
});

// ── Core Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',        authLimiter,   authRouter);
app.use('/api/folders',                    foldersRouter);
app.use('/api/files/init',  uploadLimiter);
app.use('/api/files',                      filesRouter);
app.use('/api/shares',                     sharesRouter);
app.use('/api/link-shares',                linkSharesRouter);
app.use('/api/search',                     searchRouter);
app.use('/api/stars',                      starsRouter);
app.use('/api/recent',                     recentRouter);
app.use('/api/activities',                 activitiesRouter);

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  startPurgeJob(); 
});
