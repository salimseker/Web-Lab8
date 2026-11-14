import express from 'express';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

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

const app = express();

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
