# Turnkey Web Implementation Notes

## What this build now does

- Publishes a branded Turnkey Web marketing site with:
  - service positioning
  - estimate wizard
  - async onboarding page
  - internal dashboard
- Creates CRM records in Google Sheets or a local JSON fallback
- Creates a project folder in Google Drive or a local uploads fallback
- Sends a personalized acknowledgment email after estimate submission
- Queues a draft-generation workflow
- Generates a client-site draft package through the Codex + OpenClaw pipeline
- Provisions a GitHub repo and enables GitHub Pages previews when configured
- Sends internal review context to Telegram and Slack
- Creates a Gmail draft for the client note
- Marks approved drafts for delayed send and dispatches them through cron

## Current assumptions baked into the code

- Main deployment host: Render
- Default preview host for generated client drafts: GitHub Pages
- CRM system of record: Google Sheets
- Asset storage: Google Drive
- Immediate email sender: Gmail API
- Delayed client send: Gmail draft + scheduled send through cron
- Model routing: OpenRouter with separate `PRIMARY_AGENT_MODEL` and `SECONDARY_AGENT_MODEL`

## What still needs your final business input

- Exact package names and pricing bands
- Final Turnkey Web logo treatment and domain/subdomain
- Proof assets and testimonials
- Final approval rules if any drafts should bypass or add additional checkpoints
- The exact house-style preferences Codex/OpenClaw should treat as non-negotiable for generated client drafts

## Recommended setup order

1. Fill `.env`
2. Share Google Sheet + Drive folder with the service account
3. Set Gmail OAuth credentials
4. Add Slack bot token, signing secret, and interactivity URL
5. Add Telegram bot token and chat ID
6. Add GitHub token, owner, and optional template repo
7. Set OpenRouter API key plus the primary and secondary model slugs
8. Deploy the web app first with `INLINE_WORKER=true`
9. Turn on the dedicated Render worker and cron only after the first local validation pass
