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

## Reasoning questions

### 1. Route order — experiment: 404 fallback moved to the top

I copied `server.js`, moved the `app.use((req, res) => …)` fallback directly under
`const app = express();` and requested `/`, `/hello`, `/api/courses`, `/api/stats` and `/styles.css`.
**Every single request returned 404** — even the home page and the stylesheet — and the
`/api/...` ones got the JSON `{"error":"Not found"}`. The server also printed *no log lines at
all*, only `Server running at …`. Express runs middleware and routes strictly in the order they
were registered, and `app.use()` without a path matches every request; because the fallback sends
a response and never calls `next()`, nothing registered after it — not even the logger — is ever reached.

### 2. Middleware — experiment: `next()` removed from the logger

With `next()` commented out, the server still printed the log line (`[2026-11-16T08:51:26.945Z] GET /`),
but nothing else happened. In the browser the tab just kept loading with an empty page and never
showed anything; `curl --max-time 5` on `/hello` gave up after 5 seconds without a single
byte of response (exit code 28 = timeout). The request was not rejected or crashed — it was simply
stuck: the logger neither sent a response nor passed control on, so the counter, the static files
and all routes were never reached and the connection stayed open waiting.

### 3. Status codes

`201 Created` tells the client that the request did not just succeed but **created something
new** on the server (here: a subscription), which is exactly the meaning of a successful POST;
`200 OK` would only say "it worked". A missing page must be a 404 because the status code is
what programs read, not the text: browsers, `fetch` (`response.ok` is `false` only for 4xx/5xx),
search engines and caches all decide what to do from the status line. A "200 with an error
message" would make a search engine index the error page and make my own `app.js` treat the
failure as a success.

### 4. Configuration

The port is part of the environment, not of the program. On my laptop 3000 may be free, but on a
hosting platform the platform decides the port and passes it in `process.env.PORT`, and on a
teammate's machine 3000 may already be taken by another project. Reading `process.env.PORT` with
`3000` only as a fallback means the same code runs everywhere without editing it
(`PORT=4123 node server.js` started the server on port 4123 without any change to `server.js`).

### 5. Dependencies

`node_modules/` can be recreated at any time from `package.json` + `package-lock.json`, it is
very large (thousands of files for Express alone), and it can contain platform-specific files
that would not work on another operating system — so it is listed in `.gitignore`. After
cloning, a teammate must run **`npm install`** (or `npm ci` for an exact copy of the lock file)
in the project folder, which downloads exactly the versions recorded in `package-lock.json`;
then `npm start`.

### 6. Same origin

If `index.html` were opened directly from disk, its address would be `file:///…/index.html`.
The relative URL `/api/courses` would then point to `file:///api/courses`, a file that does not
exist, and browsers do not allow `fetch` to the `file:` scheme anyway — my page would show its
"request failed" message. Even with a full URL like `http://localhost:3000/api/courses`, the page
(origin `null`) and the API would be different origins, and the browser would block the page
from reading the response unless the server sent CORS headers. This restriction is the
**Same-Origin Policy**; serving the page and the API from the same server avoids it completely.

I checked this with a small test page opened from disk in Chrome. Both fetches failed with
`Failed to fetch`, and the console said *"Access to fetch at 'file:///api/courses' from origin
'null' has been blocked by CORS policy"* and *"…'http://localhost:3000/api/courses' … No
'Access-Control-Allow-Origin' header is present"*. Interestingly, my server log still showed
`GET /api/courses` for the second one: the request **did reach the server** — it is the browser
that refuses to hand the response to the page.

## Self-study notes

| Topic | What I found (source) | How I applied it |
|---|---|---|
| Node version and running time | The global `process` object has `process.version` (a string like `"v24.15.0"`) and `process.uptime()` (seconds since the process started, as a decimal number). — [Node.js docs: process](https://nodejs.org/api/process.html) | `/api/status` returns `process.version` and `Math.floor(process.uptime())`, so the values are real and change while the server runs. |
| Sending a specific content type | `res.type(type)` sets the `Content-Type` header; `'text/plain'` becomes `text/plain; charset=utf-8`. `res.send` with a string would otherwise default to `text/html`. — [Express 5 API: res.type](https://expressjs.com/en/5x/api.html#res.type) | `/robots.txt`, `/hello` and the non-API 404 use `res.type('text/plain').send(...)`. The curl evidence shows the correct header. |
| Displaying JSON neatly | `JSON.stringify(value, replacer, space)` — the third argument is the indentation. — [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) | `app.js` reads the body with `response.text()`, tries `JSON.parse`, and shows `JSON.stringify(data, null, 2)` in a `<pre>`; if the body is not JSON it shows the raw text. |
| Finding `public/` from any folder | In ES modules there is no `__dirname`; since Node 20.11 `import.meta.dirname` gives the folder of the current file. — [Node.js docs: import.meta.dirname](https://nodejs.org/api/esm.html#importmetadirname) | `path.join(import.meta.dirname, 'public')` is passed to `express.static`. I tested it by starting the server from `/`, and the page still loaded. |
| Reading request headers | `req.get(name)` returns a header case-insensitively, or `undefined` if it is missing. — [Express 5 API: req.get](https://expressjs.com/en/5x/api.html#req.get) | `/api/headers` uses `req.get('User-Agent')` and `req.get('Accept')`, returning `null` when a header is absent. |
| 404 in Express 5 | Express 5 uses a new path syntax and rejects the bare `*` wildcard. — [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html) | The fallback is `app.use((req, res) => …)` with no path, registered last. |

## Challenges I faced

- **A broken Node.js installation.** The Homebrew `node` (v25, not an LTS release) failed to
  start with `Library not loaded: libllhttp.9.3.dylib`. I found a second, working installation
  of Node 24 LTS in `/usr/local/bin` and put it first in my `PATH`.
- **Deciding what the counter should count.** At first I was not sure whether static files and
  404s should count. I decided "requests served" means every request the server answered, and
  placed the counter before `express.static` (see *Middleware* above).
- **Testing without a browser.** My first test script sent the curl requests only one second
  after starting the server; once the server started slower than that and all requests failed.
  I changed the script to wait until the "Server running" message appeared.
- **The `next()` experiment looks like a network problem.** With `next()` removed, nothing
  errors — the request just hangs — so it is easy to blame the browser. The logger line in the
  terminal was the clue that the request did reach the server and got stuck in the middleware.
- **Keeping the browser page robust.** `fetch` does not throw for 403/404, only for network
  errors, so I had to check `response.ok` for the error styling *and* use `try/catch` for the
  case where the server is not running.
