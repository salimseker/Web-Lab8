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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
