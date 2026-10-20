# Bore — website, command directory, status page and embed builder

The official web front end for **Bore**, the BoreBot LLC Discord bot. It is a separate
React + Vite + TypeScript application that talks to the bot's existing Flask API and to
Discord's OAuth2 service. It never runs the bot, and it never contains bot or Discord
credentials in the browser bundle.

| Route                 | What it does                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| `/`                   | Marketing homepage with live statistics taken from the bot API          |
| `/commands`           | Searchable command directory generated from the running bot             |
| `/status`             | Live shard health, latency and uptime, polled from the bot API         |
| `/embed`              | Interactive Discord embed builder with a live preview and script export|
| `/auth/login`         | Real Discord OAuth2 sign-in (server-side code exchange, encrypted session) |
| `/dashboard`          | Server overview: what Bore is configured with in that server           |
| `/dashboard/general`  | Command prefix                                                         |
| `/dashboard/welcome`  | Welcome messages                                                      |
| `/dashboard/leave`    | Leave messages                                                        |
| `/dashboard/boost`    | Boost messages                                                        |
| `/dashboard/autoroles`| Auto roles assigned to new members                                     |
| `/dashboard/aliases`  | Custom command shortcuts                                              |
| `/dashboard/antinuke` | Anti-nuke thresholds, punishments, log channel and action window        |
| `/dashboard/honeypot` | Honeypot channels, staff exemption, jail role and log channel          |

---

## 1. Requirements

- Node.js 20+ (Node 22 recommended) and npm 10+
- A running instance of the **bot API** (the Flask service in the bot's `main.py`)
- A Discord application (for OAuth2) if you want the sign-in flow
- The bot's PostgreSQL database, if you want the dashboard to show a guild's prefix

## 2. Install

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:5173
```

`npm run dev` starts Vite **and** mounts the same serverless handlers under `/api/*`
through a small Vite plugin (`vite-plugin-api.ts`), so the frontend can be developed
against real API routes without a Vercel account. The route table lives in
`api/_routes.ts` and is shared between the dev server and the deployed functions.
The dev plugin also loads `.env.local` into `process.env`, so the API handlers pick up
`BOT_API_BASE_URL`, `BOT_API_KEY` and the rest locally.

Other scripts:

```bash
npm run build       # type-check + production build into dist/
npm run preview     # serve the production build locally
npm run test        # vitest unit + UI tests
npm run typecheck   # tsc --noEmit
```

## 3. Environment variables

Copy `.env.example` to `.env.local` for local development and add the same values to the
Vercel project settings. `.env*` files are git-ignored.

| Variable                | Scope   | Purpose                                                                |
| ----------------------- | ------- | ---------------------------------------------------------------------- |
| `BOT_API_BASE_URL`      | server  | Base URL of the bot's Flask API (e.g. `https://bore-api.example.com`)   |
| `BOT_API_KEY`           | server  | Shared secret sent as `X-API-Key` when the bot API requires one         |
| `BOT_CLIENT_ID`         | server  | The bot's own Discord application id, for per-server install links       |
| `DISCORD_CLIENT_ID`     | server  | Discord application id (public, but used server-side only)              |
| `DISCORD_CLIENT_SECRET` | server  | Discord application secret — never sent to the browser                  |
| `DISCORD_REDIRECT_URI`  | server  | Must be `<site>/api/auth/callback`                                      |
| `SESSION_SECRET`        | server  | 32+ random characters; encrypts the session cookie                      |
| `DATABASE_URL`          | server  | PostgreSQL connection string for the bot database                       |
| `SITE_URL`              | server  | Public origin, used for OAuth redirects. **Required in production**    |
| `VITE_DISCORD_INVITE_URL` | public | Invite link used by the “Add to Discord” buttons                       |
| `VITE_SUPPORT_URL`      | public  | Support server link used in the footer                                  |

Only `VITE_`-prefixed variables reach the browser bundle. Everything else stays on the
server and is read exclusively inside `api/`.

## 4. The bot API (deploy it separately)

The bot ships a small Flask service (`main.py` in the bot repository) that exposes:

| Endpoint        | Purpose                                       |
| --------------- | --------------------------------------------- |
| `GET /commands` | Commands grouped by category                  |
| `GET /status`   | Shard health and runtime information          |
| `GET /stats`    | Aggregate member and server counts            |
| `GET /shards`   | Shard to guild mappings                       |

This service runs **next to the Discord bot process** (it needs access to the live bot
object), so it must be deployed separately from Vercel — for example on the same host as
the bot, or on a small container service. The website never talks to it directly: the
browser calls same-origin `/api/*` routes on Vercel, and those functions proxy to
`BOT_API_BASE_URL` with a timeout, response-size cap and runtime validation (Zod).

If `BOT_API_BASE_URL` is missing or the service is down, the site shows an honest
“service unavailable” state. It never invents statistics.

**Security note:** the Flask API is reachable over the internet, so it is protected with a
shared secret. The bot reads `API_KEY` (or the file named by `API_KEY_FILE`) and rejects
requests that do not carry a matching `X-API-Key` header; `/` and `/healthz` stay open. The
proxy here sends `BOT_API_KEY` when it is set, and only ever requests the four documented
routes, so it is not an open proxy. CORS on the bot is limited to `ALLOWED_ORIGINS` (unset
by default) because the website reads the API through its own server-side functions.

The bot API also emits `status_update` Socket.IO events every ten seconds. The status
page currently polls `/status` every twelve seconds, which is reliable without extra
production configuration; a Socket.IO client can be added later without changing the
rest of the page.

## 5. Discord OAuth2 setup

1. Open the [Discord developer portal](https://discord.com/developers/applications) and
   create an application for Bore.
2. Under **OAuth2 → Redirects**, add `https://<your-domain>/api/auth/callback`
   (and `http://localhost:5173/api/auth/callback` for local development).
3. Under **OAuth2 → URL Generator**, add the redirect above with the scopes
   `identify guilds` and open the generated URL to copy the client id.
4. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` and
   `SESSION_SECRET` in the environment.

What the flow does:

1. `GET /api/auth/login` creates a cryptographically random `state`, stores it in a
   short-lived HTTP-only cookie and redirects to Discord.
2. `GET /api/auth/callback` compares the returned `state` with the cookie in constant
   time, exchanges the authorisation code for tokens **on the server**, fetches the
   signed-in user and stores an encrypted session in an HTTP-only, `SameSite=Lax`
   (`Secure` in production) cookie.
3. Access and refresh tokens are never written to `localStorage` and never returned by an
   endpoint. The session cookie holds the user profile and the access token, encrypted
   with AES-256-GCM using a key derived from `SESSION_SECRET`.
4. The user's guild list is fetched from Discord on demand (cached for five minutes per
   warm function instance) so the cookie stays small — possession of a guild id is never
   treated as proof of access.
5. `SITE_URL` must be set in production. The origin is never derived from the `Host`
   header there, so a spoofed header cannot become an open redirect.

If the OAuth variables are missing, the sign-in page explains exactly what to configure
instead of pretending to sign anyone in.

## 6. Database access

The website reads the bot's existing PostgreSQL database server-side only:

```sql
SELECT prefix FROM prefix WHERE guild_id = $1
```

This is the same table the bot uses for per-guild prefixes (`base/schema/schema.sql`).
Queries are parameterised, the pool is limited to a single connection per function
instance (appropriate for serverless), and the connection string never leaves the
server. No migration is required — the table already exists. If `DATABASE_URL` is not
set, the dashboard says the database is not configured instead of guessing a prefix.

## 7. Deploy to Vercel

1. Import the repository into Vercel (framework preset: **Vite**).
2. Add every server-side variable from the table above in **Settings → Environment
   Variables**. Add the `VITE_` ones to **Production**, **Preview** and **Development**
   as needed.
3. Deploy. `vercel.json` builds with `npm run build`, serves `dist/` and rewrites every
   non-`/api` path to `index.html` so deep links such as `/commands` work on a cold
   load. Security headers (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`,
   `Permissions-Policy`, `nosniff`) are applied to all responses.
4. Update the Discord redirect URI to the production domain.

**Vercel does not run the Discord bot.** The bot is a long-lived gateway process; it has
to stay on its own host (or container service) together with the Flask API. Deploying
the website does not start, stop or replace the bot.

## 8. Verifying the live integrations

```bash
curl -s "$BOT_API_BASE_URL/commands" | head          # the bot API itself
curl -s https://<your-domain>/api/commands           # the site proxy
curl -s https://<your-domain>/api/status
curl -s https://<your-domain>/api/stats
```

If the proxy answers with `{"error":"bot_api_unconfigured"}` the environment variable is
missing; with `bot_api_unreachable` or `bot_api_timeout` the Flask service is not
answering. Both states are rendered honestly in the UI.

## 9. Embed script format

The builder produces the exact script format the bot parses
(`base/managers/EmbedBuilder.py`):

```
{embed}$v{title:Welcome}$v{description:Hello}$v{color:77A9F7}$v{author:Bore &&  && }
$v{field:Members && 1204 && true}$v{footer:Bore && }$v{image:https://…}
$v{button: && label:Open && emoji: 🔗 && url: https://… && style: blue}
```

- Parts are separated by `$v` and wrapped in `{}`; the leading `{embed}` marker is
  dropped by the parser.
- `author`, `field`, `footer` and `button` use ` && ` between their values.
- Field inline flags are written as `true` / `false`, which is what the bot's parser
  understands (the bot's own `embedcode` command writes Python-style `True` / `False`,
  which its parser reads back as `True`).
- Button styles use the names the bot recognises: `blue`, `gray`, `green`, `red`. Anything
  else (including the `primary`/`secondary` names the bot's own `embedcode` command writes)
  falls back to grey in the bot, and the builder shows it that way too.
- Button labels are written without a space after `label:` because the bot does not trim
  them — the label the bot reads back is exactly the label that was written.
- Buttons are written as `button: && label:…` so the bot's parser sees the label on its own
  segment.

The builder never resolves `{user}` or `{guild.*}` placeholders — that happens inside
Discord when the bot sends the message. A clearly labelled sample mode shows example
values instead.

The bot API exposes no "send message" endpoint, so the builder is a client-side editor
with copy and export only. Nothing on the site claims a message was delivered.

To check the format against the real bot implementation, run the builder's serializer and
feed the result to the bot's own parser:

```bash
npm run emit:embed-script        # writes embed-script.txt in the project root
```

```python
# with the bot repository importable
from base.managers.EmbedBuilder import EmbedBuilder
content, embed, view = await EmbedBuilder.to_object(open("embed-script.txt").read())
```

## 10. The dashboard

The dashboard is a real, authenticated application surface — not a mockup. It reads and
writes the bot's own PostgreSQL tables, and every write goes through a server-side
endpoint that checks the session, the user's Discord permissions and the value itself.

**Modules** (each one backed by a table the bot already uses):

| Module        | Table(s)                                              | Permission required |
| ------------- | ----------------------------------------------------- | ------------------- |
| General       | `prefix`                                              | Manage Messages     |
| Welcome       | `welcome`                                             | Manage Messages     |
| Leave         | `leave`                                               | Manage Messages     |
| Boosts        | `boost`                                               | Manage Messages     |
| Auto roles    | `autorole`                                            | Manage Roles        |
| Aliases       | `aliases`                                             | Manage Server       |
| Anti-nuke     | `antinuke_guild`, `antinuke_settings`                 | Manage Server       |
| Honeypots     | `honeypots`, `honeypot_settings`                      | Administrator       |

No table is created, altered or migrated by this project — the dashboard only reads and
writes the schema the bot already defines in `base/schema/schema.sql`. Anything the bot
stores that has no safe dashboard surface (warnings, blacklists, AFK, VoiceMaster, booster
roles, fake permissions) is deliberately left out rather than faked.

**How authorisation works**

1. The session is verified server-side on every request (`readSession`).
2. The requested guild must be in the signed-in user's own Discord guild list — a guild id
   in the request body is never proof of access.
3. The user's permission bitfield for that guild is read from Discord
   (`GET /users/@me/guilds/{guild.id}`) and matched against the permission the module
   needs. `ADMINISTRATOR` implies the rest.
4. Channels and roles are validated against the guild's own channel and role lists before
   they are saved.

**Schema note — the `aliases` table**

The bot's code and `base/schema/schema.sql` expect a column called `alias` on the
`aliases` table:

```sql
SELECT * FROM aliases WHERE guild_id = $1 AND alias = $2
INSERT INTO aliases (guild_id, alias, command) VALUES ($1, $2, $3)
```

A database created by an older bot build still has `name`/`invoke` instead, and
`CREATE TABLE IF NOT EXISTS` never alters an existing table — so the bot's own alias commands
fail there with `column "alias" does not exist`. The dashboard detects that layout and
reports it instead of writing rows the bot could never read. The fix is an explicit,
reversible migration in [`migrations/001_aliases_columns.sql`](migrations/001_aliases_columns.sql);
it is **not** applied automatically, because the live database is not this project's to change
without authorisation.

**Endpoints**

| Endpoint                                        | Purpose                              |
| ----------------------------------------------- | ------------------------------------ |
| `GET /api/auth/me`                              | The signed-in user's public profile  |
| `POST /api/auth/logout`                         | Ends the session                     |
| `GET /api/dashboard/guilds`                     | The user's guilds and permissions    |
| `GET /api/dashboard/guilds/:id/channels`        | Channels for the pickers             |
| `GET /api/dashboard/guilds/:id/roles`           | Roles for the pickers                |
| `GET /api/dashboard/guilds/:id/config`          | Every module's stored configuration  |
| `PATCH /api/dashboard/guilds/:id/config/:module`| Saves one module                     |

The modules in the sidebar are generated from that list, so no dashboard section exists
without a real endpoint behind it.

## 11. Design language

The interface is deliberately restrained: light blue and white, one bordered surface
(`Panel`), hairline rules instead of nested cards, small type, and monospaced figures for
anything technical (ids, latency, counts, syntax, timestamps).

- **Type** — Inter for text, JetBrains Mono for identifiers and numbers. Headings are
  18–26px, never the 40px+ display sizes a template would use.
- **Surfaces** — a single border colour (`#E2E8F0`) and at most one shadow level. Gradients
  are used only where they carry meaning (the bot mark).
- **Density** — tables and definition rows instead of card grids; a command is one line,
  not a tile.
- **Status** — always a label plus a colour, never colour alone.
- **Motion** — 150–200ms fades for menus and panels only; `prefers-reduced-motion` is
  respected.

## 12. Testing

```bash
npm run test
```

There is also a live integration test that runs the dashboard handlers against the real
bot database and the real bot API (Discord itself is mocked). It is skipped unless you ask
for it:

```bash
BORE_INTEGRATION=1 \
DATABASE_URL=... BOT_API_BASE_URL=... BOT_API_KEY=... \
npx vitest run tests/dashboard-integration.test.ts
```

Covers embed serialisation/parsing and validation, command search and category filters,
status derivation and uptime handling, API error normalisation, OAuth state validation,
session encryption and protection, and React UI tests for the homepage, command
directory (including the details dialog), status page, dashboard, embed builder,
responsive navigation and the error states.

## 13. Known gaps / required backend work

| Item                                          | Status                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Bot API authentication                         | **Backend change needed** — the Flask service accepts any caller           |
| Socket.IO push updates for `/status`           | Supported by the bot API, not wired up — polling is used instead           |
| Message sending from the embed builder         | **Backend change needed** — no send endpoint exists in the bot API         |
| Dashboard configuration (moderation, logs, …)  | Not started — the dashboard shows real read-only data and marks the rest as upcoming |
| Discord member counts                          | Only available with the `guilds.members.read` scope, which is not requested |
| Rate limiting across serverless instances      | Per-instance only — use a shared store if stricter limits are required      |

## 14. Credential hygiene

The bot source archive that was used to build this site contains **live credentials**
(a bot token, a database password and a Lavalink password) committed in
`base/config.py`. Treat them as compromised and rotate them. They are deliberately not
copied into this repository, into `.env.example` or into any generated file, and no
credential from that archive is used by this site.
