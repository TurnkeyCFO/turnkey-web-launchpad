import path from "node:path";
import express from "express";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { budgetBands, features, goals, pageCountBands, projectTypes, timelineBands } from "./lib/catalog.js";
import { getLeadBundle, listDashboardData } from "./lib/crm.js";
import { computeEstimate } from "./lib/pricing.js";
import {
  applyDraftDecision,
  bootstrapSocialAgent,
  draftIdeaForApproval,
  draftPlannedIdeasForBrand,
  generateAdvisorReports,
  generateWeeklySlate,
  getSocialOverview,
  publishApprovedPosts,
  runSocialAgentOpsCycle,
  refreshMonitoring
} from "./lib/social-agent.js";
import { verifySlackSignature } from "./lib/slack.js";
import { applyApprovalDecision, bootstrapApp, processQueuedDrafts, submitEstimate, submitOnboarding } from "./lib/workflow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.use(express.json({ limit: "2mb" }));
app.use(
  express.urlencoded({
    extended: true,
    verify: (request, _response, buffer) => {
      request.rawBody = buffer.toString("utf8");
    }
  })
);
app.use(express.static(publicDir));

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, env: config.appEnv, inlineWorker: config.inlineWorker });
});

app.get("/api/config", (_request, response) => {
  response.json({
    projectTypes,
    timelineBands,
    budgetBands,
    pageCountBands,
    goals,
    features
  });
});

app.post("/api/estimate", async (request, response) => {
  try {
    const result = await submitEstimate(request.body);
    response.status(201).json({ ok: true, ...result });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/estimate-preview", (request, response) => {
  try {
    const estimate = computeEstimate({
      ...request.body,
      projectTypeLabel: projectTypes.find((item) => item.value === request.body.projectType)?.label
    });
    response.json({ ok: true, estimate });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/leads/:leadId", async (request, response) => {
  const bundle = await getLeadBundle(request.params.leadId);
  if (!bundle) {
    response.status(404).json({ ok: false, error: "Lead not found" });
    return;
  }

  response.json({ ok: true, bundle });
});

app.post("/api/onboarding", upload.array("assets", 10), async (request, response) => {
  try {
    const result = await submitOnboarding({
      fields: request.body,
      files: request.files || []
    });
    response.status(201).json({ ok: true, ...result });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/admin/overview", async (_request, response) => {
  const data = await listDashboardData();
  response.json({ ok: true, ...data });
});

app.get("/api/social-agent/overview", async (_request, response) => {
  const overview = await getSocialOverview();
  response.json({ ok: true, ...overview });
});

app.post("/api/social-agent/brands/:brandKey/generate-plan", async (request, response) => {
  try {
    const ideas = await generateWeeklySlate({ brandKey: request.params.brandKey });
    response.json({ ok: true, ideas });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/social-agent/ideas/:ideaId/draft", async (request, response) => {
  try {
    const draft = await draftIdeaForApproval(request.params.ideaId);
    response.json({ ok: true, draft });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/social-agent/brands/:brandKey/draft-planned", async (request, response) => {
  try {
    const drafts = await draftPlannedIdeasForBrand({
      brandKey: request.params.brandKey,
      limit: Number(request.body.limit || 3)
    });
    response.json({ ok: true, drafts });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/social-agent/drafts/:draftId/decision", async (request, response) => {
  try {
    const draft = await applyDraftDecision({
      draftId: request.params.draftId,
      decision: request.body.decision || "changes_requested",
      reviewer: request.body.reviewer || "dashboard"
    });
    response.json({ ok: true, draft });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/social-agent/publish", async (_request, response) => {
  const results = await publishApprovedPosts();
  response.json({ ok: true, results });
});

app.post("/api/social-agent/monitor", async (_request, response) => {
  const result = await refreshMonitoring();
  response.json({ ok: true, ...result });
});

app.post("/api/social-agent/advisor", async (_request, response) => {
  const reports = await generateAdvisorReports();
  response.json({ ok: true, reports });
});

app.post("/api/social-agent/cycle", async (request, response) => {
  const result = await runSocialAgentOpsCycle({
    includeAdvisor: request.body.includeAdvisor !== false
  });
  response.json({ ok: true, ...result });
});

app.post("/api/internal/process-drafts", async (request, response) => {
  if (config.cronSecret && request.headers["x-cron-secret"] !== config.cronSecret) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const results = await processQueuedDrafts({ limit: Number(request.body.limit || 1) });
  response.json({ ok: true, results });
});

app.post("/api/slack/interactivity", async (request, response) => {
  const rawBody = request.rawBody || "";
  const timestamp = request.header("x-slack-request-timestamp");
  const signature = request.header("x-slack-signature");

  if (!verifySlackSignature({ rawBody, timestamp, signature })) {
    response.status(401).send("Invalid signature");
    return;
  }

  const payload = JSON.parse(request.body.payload || "{}");
  const action = payload.actions?.[0];
  if (!action?.value) {
    response.status(400).send("Missing action payload");
    return;
  }

  const value = JSON.parse(action.value);
  await applyApprovalDecision(value.token, value.decision, payload.user?.username || payload.user?.name || "Slack");
  response.json({
    response_type: "ephemeral",
    text: `Turnkey Web draft ${value.decision}.`
  });
});

app.get("/approve/:token", async (request, response) => {
  const decision = request.query.decision === "rejected" ? "rejected" : "approved";
  const result = await applyApprovalDecision(request.params.token, decision, "Approval link");

  if (!result) {
    response.status(404).send("<h1>Approval token not found</h1>");
    return;
  }

  response.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Turnkey Web Approval</title>
<style>body{font-family:"Plus Jakarta Sans",sans-serif;background:#f2f5f8;color:#0d1f2d;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:560px;background:#fff;border:1px solid rgba(0,38,58,.1);border-radius:24px;padding:28px;box-shadow:0 18px 40px rgba(7,47,69,.1)}h1{margin-top:0}a{color:#003a56}</style></head>
<body><div class="card"><h1>Draft ${decision}</h1><p>The Turnkey Web draft has been marked as <strong>${decision}</strong>.</p><p>You can close this window and return to Slack or email.</p><p><a href="/admin.html">Open the internal dashboard</a></p></div></body></html>`);
});

app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  const target =
    request.path === "/onboarding"
      ? "onboarding.html"
      : request.path === "/admin"
        ? "admin.html"
        : request.path === "/social-agent"
          ? "social-agent.html"
          : request.path === "/work"
            ? "work.html"
            : request.path === "/process"
              ? "process.html"
              : request.path === "/pricing"
                ? "pricing.html"
                : "index.html";
  response.sendFile(path.join(publicDir, target));
});

async function start() {
  await bootstrapApp();
  await bootstrapSocialAgent();

  app.listen(config.port, () => {
    console.log(`Turnkey Web server listening on ${config.port}`);
  });

  if (config.inlineWorker) {
    setInterval(() => {
      processQueuedDrafts({ limit: 1 }).catch((error) => {
        console.error("Inline worker error", error);
      });
    }, config.workerPollMs).unref();
  }
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
