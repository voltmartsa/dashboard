# Foundry

A personal dashboard for running both your business and personal life from one place: tasks, projects, notes, a calendar, and habits — with an AI-assisted "break into subtasks" feature, a login gate, and email/WhatsApp notifications.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 + SQLite (local file, `dev.db`), via the `better-sqlite3` driver adapter
- Anthropic API (`@anthropic-ai/sdk`) for AI subtask breakdown
- `jose` + `bcryptjs` for the login gate, `nodemailer` + `twilio` for notifications

## Setup

```bash
npm install
npx prisma migrate dev   # creates dev.db and applies the schema (already run once)
npx prisma db seed       # optional: loads sample Business/Personal data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Enabling AI subtask breakdown

Add your Anthropic API key to `.env` at the project root:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Get a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys), then restart `npm run dev`. Without a key, everything else works normally — only the "Break into subtasks" button on a task's detail page needs it. The `/settings` page shows whether a key is currently configured.

### Login

Every route requires a password (`src/proxy.ts` gates the whole app). Set it up locally with:

```bash
npm run hash-password -- "your-chosen-password"
```

Paste the printed hash into `.env` as `AUTH_PASSWORD_HASH`. `AUTH_SECRET` (used to sign the session cookie) is already pre-filled with a generated value — regenerate it any time with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Changing `AUTH_SECRET` invalidates all existing sessions (forces re-login everywhere).

### Notifications (Notifications tab)

Add recipients (email and/or WhatsApp number) on the `/notifications` page, and toggle whether each gets the daily "today's tasks" digest, the weekly summary, or both. Two things need configuring in `.env` before sending actually works:

- **Email** — your cPanel mailbox's SMTP credentials: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- **WhatsApp** — a [Twilio](https://console.twilio.com/) account using the **WhatsApp Sandbox** (Messaging → Try it out → Send a WhatsApp message): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`. Each recipient's WhatsApp number must send the sandbox's join code once before it can receive anything — Twilio's console shows the exact code. The sandbox is meant for testing your own number(s); moving to arbitrary recipients means applying for WhatsApp Business API production access later.

Use the "Send test" button on any recipient to verify your SMTP/Twilio setup without waiting for a scheduled digest.

Digests aren't sent by the web app itself — they're triggered by hitting `/api/cron/daily-digest?secret=...` and `/api/cron/weekly-digest?secret=...` (see "Deploying to cPanel" below for wiring these to actual cron jobs). Set `CRON_SECRET` in `.env` to whatever you'll use in the cron command.

## Data

Everything lives locally in `dev.db` (SQLite). Nothing is sent anywhere except: the subtask-breakdown request (to Anthropic, when you trigger it) and notification sends (to your SMTP server / Twilio, when a recipient is due a digest or you click "Send test").

## Deploying to cPanel

This app is built to run on cPanel shared/VPS hosting via **Setup Node.js App** (Phusion Passenger), without needing SSH access. The local SQLite file works fine there since cPanel's filesystem is persistent (unlike serverless hosting).

1. **Upload the project** to your hosting account (via Git or the File Manager's zip upload), excluding `node_modules/`, `.next/`, and `dev.db` (a fresh one is created on first migrate).
2. In cPanel, open **Setup Node.js App** → **Create Application**:
   - Node.js version: pick the newest available.
   - Application root: the folder you uploaded to.
   - Application startup file: `server.js`.
3. In the same screen, add every environment variable from your local `.env` (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `AUTH_PASSWORD_HASH`, `SMTP_*`, `TWILIO_*`, `CRON_SECRET`) under **Environment Variables** — set these *before* the next step.
4. Click **Run NPM Install**. This alone installs dependencies, generates the Prisma client, applies migrations, and runs the production build (`postinstall` in `package.json` chains all of it) — the only build trigger you need, with no terminal required. Re-run this same button after any future code update.
5. Start (or restart) the app from the same screen.
6. Add two **Cron Jobs** (cPanel's own Cron Jobs UI, separate from Setup Node.js App):
   - Daily, e.g. `0 8 * * *` → `curl -s "https://yourdomain.com/api/cron/daily-digest?secret=YOUR_CRON_SECRET"`
   - Weekly, e.g. `0 8 * * 1` → `curl -s "https://yourdomain.com/api/cron/weekly-digest?secret=YOUR_CRON_SECRET"`

## Project structure

```
prisma/schema.prisma      Data model (Task, Project, Note, Habit, HabitLog, NotificationRecipient)
prisma/seed.ts             Sample data
server.js                  Passenger/cPanel entry point (custom Node server)
src/proxy.ts                Login gate — runs on every route
src/app/(dashboard)/         Gated routes: dashboard, tasks, projects, notes, calendar, habits, settings, notifications
src/app/login/               Public login page
src/app/api/cron/            Secret-protected endpoints that trigger notification digests
src/actions/                 Server actions (mutations, the AI call, auth, notifications)
src/components/              UI, grouped by module
src/lib/                     Prisma client, Anthropic client, session/auth, notifications, date/area helpers
```
