import path from 'node:path';
import express from 'express';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

// Absolute path built from this file's location (not the current working
// directory), so the server finds public/ no matter where it is started from.
const PUBLIC_DIR = path.join(import.meta.dirname, 'public');

// ---------------------------------------------------------------------------
// Hard-coded data
// ---------------------------------------------------------------------------
const OWNER_NAME = 'Salim';

const ROBOTS_TXT = [
  '# robots.txt for the Northwind Web Engineering Programme server',
  'User-agent: *',
  'Disallow: /api/',
  'Allow: /',
].join('\n');

const COURSES = Object.freeze([
  Object.freeze({ id: 1, title: 'Foundations of HTML and CSS', credits: 5 }),
  Object.freeze({ id: 2, title: 'JavaScript in the Browser', credits: 6 }),
  Object.freeze({ id: 3, title: 'Back-end Development with Node.js', credits: 6 }),
  Object.freeze({ id: 4, title: 'Web Accessibility and Usability', credits: 4 }),
]);

// The only mutable state in the app: a number we own, never a shared object.
let requestsServed = 0;

const app = express();

// ---------------------------------------------------------------------------
// Middleware (registered before every route so each request passes through)
// ---------------------------------------------------------------------------
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

const requestCounter = (req, res, next) => {
  requestsServed += 1;
  next();
};

app.use(requestLogger);
app.use(requestCounter);

// Static files: GET / serves public/index.html, plus styles.css and app.js.
app.use(express.static(PUBLIC_DIR));

// ---------------------------------------------------------------------------
// Text and redirect routes
// ---------------------------------------------------------------------------
app.get('/hello', (req, res) => {
  res.type('text/plain').send(`Hello from ${OWNER_NAME}'s server`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(ROBOTS_TXT);
});

app.get('/old-page', (req, res) => {
  res.redirect('/hello');
});

// ---------------------------------------------------------------------------
// JSON API routes
// ---------------------------------------------------------------------------
app.get('/api/courses', (req, res) => {
  res.json(COURSES);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/api/headers', (req, res) => {
  res.json({
    userAgent: req.get('User-Agent') ?? null,
    accept: req.get('Accept') ?? null,
  });
});

app.post('/api/subscribe', (req, res) => {
  res.status(201).json({ subscribed: true });
});

app.get('/api/admin', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

app.get('/api/stats', (req, res) => {
  res.json({ requestsServed });
});

// ---------------------------------------------------------------------------
// 404 fallback — MUST stay last: app.use() without a path matches everything,
// so any route registered after it would never be reached.
// (Express 5 rejects the old app.get('*') wildcard, so we use app.use.)
// ---------------------------------------------------------------------------
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(404).type('text/plain').send(`404 – The page ${req.path} was not found.`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
