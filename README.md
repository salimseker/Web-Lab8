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

## Testing evidence (`curl --include`)

The server was started with `npm start` (port 3000) and every request below was sent from a
second terminal on 2026-11-16. `--include` prints the status line and the response headers
before the body. The matching log lines printed by the server were:

```text
Server running at http://localhost:3000
[2026-11-16T08:53:10.297Z] GET /api/courses
[2026-11-16T08:53:10.311Z] GET /api/status
[2026-11-16T08:53:10.319Z] POST /api/subscribe
[2026-11-16T08:53:10.327Z] GET /api/admin
[2026-11-16T08:53:10.335Z] GET /old-page
[2026-11-16T08:53:10.343Z] GET /api/does-not-exist
[2026-11-16T08:53:10.350Z] GET /no-such-page
[2026-11-16T08:53:10.357Z] GET /robots.txt
```

### 1. Successful JSON response — `GET /api/courses`

```http
$ curl --include localhost:3000/api/courses
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 245
ETag: W/"f5-dE4SdNhFBLaRLPyA149i9uvAY+U"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Foundations of HTML and CSS","credits":5},{"id":2,"title":"JavaScript in the Browser","credits":6},{"id":3,"title":"Back-end Development with Node.js","credits":6},{"id":4,"title":"Web Accessibility and Usability","credits":4}]
```

Status `200 OK`, and `Content-Type: application/json` because the route uses `res.json`.

### 2. Successful JSON response with live process values — `GET /api/status`

```http
$ curl --include localhost:3000/api/status
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 58
ETag: W/"3a-Z7uKKy0MtZ3Xj5FdDFXav6kzuvw"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok","nodeVersion":"v24.15.0","uptimeSeconds":0}
```

`nodeVersion` comes from `process.version` and `uptimeSeconds` from `process.uptime()` (0 because the server had just started).

### 3. The 201 response — `POST /api/subscribe`

```http
$ curl --include -X POST localhost:3000/api/subscribe
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 19
ETag: W/"13-oWAPIqDXuocNexKhPYW9ayyk98c"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"subscribed":true}
```

`201 Created` instead of the default 200, set with `res.status(201)`.

### 4. The 403 response — `GET /api/admin`

```http
$ curl --include localhost:3000/api/admin
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-TLNzmZqKxaTuFdX/dVWWPBu44/c"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Forbidden"}
```

`403 Forbidden` with a JSON error body.

### 5. The redirect — `GET /old-page`

```http
$ curl --include localhost:3000/old-page
HTTP/1.1 302 Found
X-Powered-By: Express
Location: /hello
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 28
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Found. Redirecting to /hello
```

`302 Found` plus a `Location: /hello` header — that header is what makes the browser follow the redirect. (`curl -L` would follow it too.)

### 6. 404 on an `/api` path — JSON body

```http
$ curl --include localhost:3000/api/does-not-exist
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

The fallback checks `req.path.startsWith('/api')` and answers with JSON, so API clients always get JSON.

### 7. 404 on a non-API path — plain-text body

```http
$ curl --include localhost:3000/no-such-page
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 45
ETag: W/"2d-BszNuxRZ7xstVvm+UrjOLY23zN0"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

404 – The page /no-such-page was not found.
```

Same fallback, but for normal pages it answers with a short human-readable text message.

### 8. Plain-text file with the correct content type — `GET /robots.txt`

```http
$ curl --include localhost:3000/robots.txt
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 102
ETag: W/"66-AgAiANDfOIH/A3goopoDx4uJVes"
Date: Mon, 16 Nov 2026 08:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

# robots.txt for the Northwind Web Engineering Programme server
User-agent: *
Disallow: /api/
Allow: /
```

`res.type('text/plain')` sets `Content-Type: text/plain; charset=utf-8`.
