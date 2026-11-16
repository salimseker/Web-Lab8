# Web-Lab8 — Northwind Programme Information Server

A small **Node.js + Express 5** back-end for a made-up study programme, the
*Northwind Web Engineering Programme*. The same server:

- serves a plain HTML/CSS/JS page that introduces the programme and lets you try every API route,
- answers a handful of routes with text, JSON, errors and a redirect,
- logs every request it receives,
- counts how many requests it has served since it started.

There is no database, no login and no persistence — all data is hard-coded in `server.js`.

---

## Requirements

- **Node.js 24 LTS** (any version ≥ 20.11 works, because the code uses `import.meta.dirname`)
- npm (comes with Node.js)

## Installation and running

```bash
git clone https://github.com/salimseker/Web-Lab8.git
cd Web-Lab8
npm install          # downloads express into node_modules/ (not committed)
npm start            # node server.js
```

Then open **http://localhost:3000**.

| Command | What it does |
|---|---|
| `npm start` | Runs the server once with `node server.js` |
| `npm run dev` | Runs `node --watch server.js` — Node restarts the server automatically when a file changes (no nodemon needed) |
| `PORT=4000 npm start` | Runs the server on another port (the code reads `process.env.PORT` and falls back to `3000`) |

The server can be started from any folder, for example
`node ~/projects/Web-Lab8/server.js`, because the path to `public/` is built
from the location of `server.js` itself, not from the current working directory.

## File organization

```
Web-Lab8/
├── package.json        # "type": "module", start/dev scripts, express dependency
├── package-lock.json   # exact dependency versions (committed)
├── .gitignore          # excludes node_modules/ and .env
├── server.js           # Express app: data, middleware, routes, 404 fallback
├── public/             # served by express.static
│   ├── index.html      # programme intro + one button per API route
│   ├── styles.css      # all styling (no inline styles)
│   └── app.js          # fetch() logic for the buttons (no inline scripts)
└── README.md
```

`server.js` is organised top to bottom in the same order Express handles a request:

1. configuration (`PORT`, `PUBLIC_DIR`) and hard-coded data (`COURSES`, `ROBOTS_TXT`, …)
2. middleware: request logger → request counter → `express.static`
3. text and redirect routes (`/hello`, `/robots.txt`, `/old-page`)
4. JSON API routes (`/api/...`)
5. the 404 fallback — always last
6. `app.listen`

## Routes

| Method and path | Response |
|---|---|
| `GET /` | `public/index.html` (served by `express.static`) |
| `GET /hello` | `200` plain text: `Hello from Salim's server` |
| `GET /robots.txt` | `200` plain text (`Content-Type: text/plain`) |
| `GET /old-page` | `302` redirect to `/hello` |
| `GET /api/courses` | `200` JSON array of 4 courses (`id`, `title`, `credits`) |
| `GET /api/status` | `200` JSON `{ status, nodeVersion, uptimeSeconds }` from the running process |
| `GET /api/headers` | `200` JSON echoing the request's `User-Agent` and `Accept` headers |
| `POST /api/subscribe` | `201` JSON `{ "subscribed": true }` |
| `GET /api/admin` | `403` JSON `{ "error": "Forbidden" }` |
| `GET /api/stats` | `200` JSON `{ "requestsServed": <number> }` |
| anything else under `/api` | `404` JSON `{ "error": "Not found" }` |
| anything else | `404` plain text "The page … was not found." |

## Middleware: order and counting rules

Both middleware functions are registered with `app.use()` **before** `express.static` and
before every route, and both call `next()` so the request continues down the chain.

1. **Request logger** — prints one line per request, e.g.
   `[2026-11-16T08:51:10.128Z] GET /hello`. It is first so that *every* request is logged,
   even one that later ends in a 404 or is answered by `express.static`.
2. **Request counter** — adds 1 to `requestsServed`, which `GET /api/stats` returns.

**Which requests are counted?** Every HTTP request that reaches the server, because the
counter runs before anything that could send a response:

- static files are counted (`/`, `/styles.css`, `/app.js`, and the browser's automatic `/favicon.ico`),
- 404s are counted (they are still requests the server answered),
- a redirect counts twice: once for `/old-page` and once for the `/hello` request the browser makes next,
- the `GET /api/stats` request itself is counted, so the number it returns already includes it.

I chose this on purpose: the route is called *requests served*, and every one of these requests
really was served with a response. If the counter were placed after `express.static`, page loads
would be invisible in the statistics; if it were placed inside the API routes only, 404s would be
missing. Opening the page once in a browser therefore already adds 3–4 to the counter.

**Immutability:** the course data is frozen with `Object.freeze`, and the middleware never adds
properties to `req` or `res` (objects created by Express, not by me). The only value that changes
is `requestsServed`, a plain number that belongs to this module.
