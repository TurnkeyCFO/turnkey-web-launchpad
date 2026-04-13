import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  rootDir,
  port: number(process.env.PORT, 3000),
  appEnv: process.env.APP_ENV || "development",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  ownerName: process.env.TURNKEY_WEB_OWNER_NAME || "Ricky",
  ownerEmail: process.env.TURNKEY_WEB_OWNER_EMAIL || "",
  approvalBaseUrl: process.env.TURNKEY_WEB_APPROVAL_BASE_URL || process.env.APP_BASE_URL || "http://localhost:3000",
  inlineWorker: bool(process.env.INLINE_WORKER, true),
  workerPollMs: number(process.env.WORKER_POLL_MS, 45000),
  cronSecret: process.env.CRON_SECRET || "",
  jobClaimTtlMinutes: number(process.env.JOB_CLAIM_TTL_MINUTES, 20),
  localDataDir: path.resolve(rootDir, process.env.LOCAL_DATA_DIR || "./data"),
  google: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || "",
    driveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "",
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "",
    appsScriptWebhookUrl: process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL || "",
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
    gmailFromEmail: process.env.GMAIL_FROM_EMAIL || ""
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || "",
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
    approvalChannel: process.env.SLACK_APPROVAL_CHANNEL || ""
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || ""
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "",
    templateOwner: process.env.GITHUB_TEMPLATE_OWNER || "",
    templateRepo: process.env.GITHUB_TEMPLATE_REPO || "",
    defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || "main",
    committerName: process.env.GITHUB_COMMITTER_NAME || "Turnkey Web Bot",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "bot@turnkeyweb.local",
    pagesBranch: process.env.GITHUB_PAGES_BRANCH || "main",
    pagesPath: process.env.GITHUB_PAGES_PATH || "/docs"
  },
  preview: {
    provider: process.env.PREVIEW_PROVIDER || "github-pages",
    renderApiKey: process.env.RENDER_API_KEY || "",
    renderOwnerId: process.env.RENDER_OWNER_ID || "",
    renderPreviewEnvGroupId: process.env.RENDER_PREVIEW_ENV_GROUP_ID || ""
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    apiBase: process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1",
    primaryAgentModel: process.env.PRIMARY_AGENT_MODEL || "",
    secondaryAgentModel: process.env.SECONDARY_AGENT_MODEL || "",
    httpReferer: process.env.OPENROUTER_HTTP_REFERER || "",
    appTitle: process.env.OPENROUTER_APP_TITLE || "Turnkey Web Draft Pipeline"
  },
  social: {
    defaultTimezone: process.env.SOCIAL_DEFAULT_TIMEZONE || "America/Chicago",
    approvalEmail: process.env.SOCIAL_APPROVAL_EMAIL || process.env.TURNKEY_WEB_OWNER_EMAIL || "",
    approvalChannel: process.env.SOCIAL_APPROVAL_CHANNEL || process.env.SLACK_APPROVAL_CHANNEL || "",
    simulatePublishing: bool(process.env.SOCIAL_SIMULATE_PUBLISHING, true),
    researchWindowMinutes: number(process.env.SOCIAL_RESEARCH_WINDOW_MINUTES, 4),
    feedSize: number(process.env.SOCIAL_FEED_SIZE, 5),
    linkedInAccessToken: process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN || "",
    linkedInVersion: process.env.SOCIAL_LINKEDIN_VERSION || "202602",
    facebookAccessToken: process.env.SOCIAL_FACEBOOK_ACCESS_TOKEN || "",
    turnkeyCfoLinkedInOrganizationUrn: process.env.SOCIAL_TURNKEYCFO_LINKEDIN_ORGANIZATION_URN || "",
    turnkeyWebLinkedInOrganizationUrn: process.env.SOCIAL_TURNKEYWEB_LINKEDIN_ORGANIZATION_URN || "",
    turnkeyCfoFacebookPageId: process.env.SOCIAL_TURNKEYCFO_FACEBOOK_PAGE_ID || "",
    turnkeyWebFacebookPageId: process.env.SOCIAL_TURNKEYWEB_FACEBOOK_PAGE_ID || ""
  }
};

export const hasGoogleSheets = Boolean(config.google.spreadsheetId && config.google.serviceAccountJson);
export const hasDrive = Boolean(config.google.driveRootFolderId && config.google.serviceAccountJson);
export const hasGmail = Boolean(
  config.google.clientId &&
    config.google.clientSecret &&
    config.google.refreshToken &&
    config.google.gmailFromEmail
);
export const hasSlack = Boolean(config.slack.botToken && config.slack.approvalChannel);
export const hasTelegram = Boolean(config.telegram.botToken && config.telegram.chatId);
export const hasGitHub = Boolean(config.github.token);
export const hasOpenRouter = Boolean(
  config.openrouter.apiKey &&
    (config.openrouter.primaryAgentModel || config.openrouter.secondaryAgentModel)
);
export const hasSocialSlack = Boolean(config.slack.botToken && config.social.approvalChannel);
export const hasSocialEmail = Boolean(config.social.approvalEmail);
