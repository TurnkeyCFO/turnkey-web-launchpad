# Turnkey Web Launchpad

Turnkey Web is an async-first website sales funnel and automation pipeline built to:

- capture estimates
- onboard assets without meetings
- generate a draft website through a Codex + OpenClaw workflow
- notify internal reviewers through Telegram and Slack
- create and later send personalized Gmail drafts
- track every lead in a lightweight CRM backed by Google Sheets and Drive

## What is in this repo

- `public/` brand-forward marketing site, estimate wizard, onboarding flow, and internal dashboard
- `public/social-agent.html` social media management console for TurnkeyCFO and Turnkey Web
- `src/server.js` Express app for public pages, APIs, approvals, and admin reads
- `src/worker.js` draft generation worker for repo creation, preview publishing, Gmail drafts, and internal notifications
- `src/cron.js` scheduled sender for approved outbound emails plus retry/reconciliation hooks
- `src/lib/` CRM adapters, pricing logic, Google/Slack/Telegram/GitHub/OpenRouter clients, and workflow orchestration
- `templates/client-site/` deterministic starter site used for generated client previews
- `render.yaml` Render blueprint for a web app, worker, and cron job

## Local setup

1. Copy `.env.example` to `.env`
2. Fill in the credentials you already have
3. Install dependencies:

```powershell
npm.cmd install
```

4. Run the app:

```powershell
npm.cmd run dev
```

5. Optional worker and cron during local testing:

```powershell
npm.cmd run worker
npm.cmd run cron
```

## n8n social agent setup

There is now a starter `n8n/` folder for the social media agent:

- `n8n/docker-compose.yml` self-hosted n8n stack
- `n8n/.env.example` local n8n env template
- `n8n/workflows/` importable starter workflows
- `docs/SOCIAL_AGENT_N8N_SETUP.md` setup guide
- `npm.cmd run n8n:local` local no-Docker fallback

## Minimal-subscription mode

If you want to keep costs down while validating the funnel:

- keep `INLINE_WORKER=true`
- run only the web service first
- use Google Sheets as CRM instead of a database
- use GitHub Pages for generated previews unless you decide Render previews are worth the extra setup

The code still supports a dedicated Render worker and cron job when you are ready.

## External setup you still need to do

- share the Google Sheet and Drive root folder with the Google service account
- configure Gmail OAuth credentials and refresh token
- add the Slack interactivity request URL to `/api/slack/interactivity`
- add social agent env vars if you want real LinkedIn and Facebook publishing instead of simulated publishing
- create a Telegram bot and add its chat ID
- create or choose a GitHub template repo for generated client sites
- choose exact package names, pricing bands, and final Turnkey Web branding

## Tests

```powershell
npm.cmd test
```
