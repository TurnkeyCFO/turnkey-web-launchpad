import path from "node:path";
import { config, hasGoogleSheets } from "../config.js";
import { getSheetsClient } from "./google.js";
import { createId, ensureDir, json, nowIso, readJson, safeJsonParse, writeJson } from "./utils.js";

const tabs = {
  Leads: [
    "leadId",
    "createdAt",
    "updatedAt",
    "stage",
    "firstName",
    "lastName",
    "email",
    "company",
    "phone",
    "industry",
    "currentSiteUrl",
    "projectType",
    "timeline",
    "budgetBand",
    "pageCountBand",
    "goalsJson",
    "featuresJson",
    "notes",
    "recommendedPackage",
    "estimateLow",
    "estimateHigh",
    "confidence",
    "onboardingStatus",
    "driveFolderId",
    "driveFolderUrl"
  ],
  Estimates: [
    "estimateId",
    "leadId",
    "createdAt",
    "packageName",
    "priceLow",
    "priceHigh",
    "monthlyLow",
    "monthlyHigh",
    "confidence",
    "rationaleJson",
    "addOnsJson",
    "inputSnapshotJson"
  ],
  Projects: [
    "projectId",
    "leadId",
    "createdAt",
    "updatedAt",
    "draftStatus",
    "repoName",
    "repoUrl",
    "previewProvider",
    "previewUrl",
    "creativeBriefJson",
    "siteSpecJson",
    "artifactJson",
    "draftRequestedAt",
    "draftClaimedAt",
    "draftCompletedAt",
    "lastError",
    "sendAt",
    "approvedAt"
  ],
  Approvals: [
    "approvalId",
    "leadId",
    "createdAt",
    "updatedAt",
    "decision",
    "token",
    "channel",
    "reviewer",
    "notes"
  ],
  Emails: [
    "emailId",
    "leadId",
    "createdAt",
    "updatedAt",
    "kind",
    "recipient",
    "subject",
    "bodyPreview",
    "gmailDraftId",
    "gmailMessageId",
    "status",
    "sendAt",
    "sentAt",
    "metadataJson"
  ],
  "Activity Log": ["activityId", "leadId", "createdAt", "stage", "action", "detailsJson"]
};

const devFile = path.join(config.localDataDir, "crm.json");

async function ensureLocalStore() {
  await ensureDir(config.localDataDir);
  const payload = await readJson(devFile, null);
  if (payload) {
    return payload;
  }

  const seed = Object.fromEntries(Object.keys(tabs).map((tab) => [tab, []]));
  await writeJson(devFile, seed);
  return seed;
}

async function saveLocalStore(payload) {
  await writeJson(devFile, payload);
}

async function ensureSheetTabs() {
  const sheets = getSheetsClient();
  if (!sheets) {
    return;
  }

  const metadata = await sheets.spreadsheets.get({ spreadsheetId: config.google.spreadsheetId });
  const existing = new Set((metadata.data.sheets || []).map((sheet) => sheet.properties?.title));
  const requests = [];

  for (const [name] of Object.entries(tabs)) {
    if (!existing.has(name)) {
      requests.push({ addSheet: { properties: { title: name } } });
    }
  }

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.google.spreadsheetId,
      requestBody: { requests }
    });
  }

  for (const [name, headers] of Object.entries(tabs)) {
    const headerRange = `'${name}'!1:1`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.spreadsheetId,
      range: headerRange
    });

    const firstRow = response.data.values?.[0] || [];
    if (!firstRow.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.google.spreadsheetId,
        range: headerRange,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
      });
    }
  }
}

async function getRows(tabName) {
  if (!hasGoogleSheets) {
    const store = await ensureLocalStore();
    return store[tabName] || [];
  }

  await ensureSheetTabs();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: `'${tabName}'!A:ZZ`
  });

  const values = response.data.values || [];
  const headers = values[0] || tabs[tabName];
  return values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

async function writeRows(tabName, rows) {
  if (!hasGoogleSheets) {
    const store = await ensureLocalStore();
    store[tabName] = rows;
    await saveLocalStore(store);
    return;
  }

  await ensureSheetTabs();
  const sheets = getSheetsClient();
  const headers = tabs[tabName];
  const values = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.google.spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values }
  });
}

function hydrateLead(row) {
  return row
    ? {
        ...row,
        goals: safeJsonParse(row.goalsJson, []),
        features: safeJsonParse(row.featuresJson, [])
      }
    : null;
}

function hydrateEstimate(row) {
  return row
    ? {
        ...row,
        priceLow: Number(row.priceLow || 0),
        priceHigh: Number(row.priceHigh || 0),
        rationale: safeJsonParse(row.rationaleJson, []),
        addOns: safeJsonParse(row.addOnsJson, []),
        inputSnapshot: safeJsonParse(row.inputSnapshotJson, {})
      }
    : null;
}

function hydrateProject(row) {
  return row
    ? {
        ...row,
        creativeBrief: safeJsonParse(row.creativeBriefJson, {}),
        siteSpec: safeJsonParse(row.siteSpecJson, {}),
        artifact: safeJsonParse(row.artifactJson, {})
      }
    : null;
}

function hydrateEmail(row) {
  return row ? { ...row, metadata: safeJsonParse(row.metadataJson, {}) } : null;
}

function hydrateActivity(row) {
  return row ? { ...row, details: safeJsonParse(row.detailsJson, {}) } : null;
}

export async function initializeCrm() {
  if (!hasGoogleSheets) {
    await ensureLocalStore();
    return { mode: "local" };
  }

  await ensureSheetTabs();
  return { mode: "sheets" };
}

export async function createLeadBundle({ lead, estimate, driveFolder }) {
  const leads = await getRows("Leads");
  const estimates = await getRows("Estimates");
  const projects = await getRows("Projects");

  leads.push({
    leadId: lead.leadId,
    createdAt: lead.createdAt,
    updatedAt: nowIso(),
    stage: lead.stage,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    company: lead.company,
    phone: lead.phone || "",
    industry: lead.industry || "",
    currentSiteUrl: lead.currentSiteUrl || "",
    projectType: lead.projectType,
    timeline: lead.timeline,
    budgetBand: lead.budgetBand,
    pageCountBand: lead.pageCountBand,
    goalsJson: json(lead.goals),
    featuresJson: json(lead.features),
    notes: lead.notes || "",
    recommendedPackage: estimate.recommendedPackage,
    estimateLow: String(estimate.range.low),
    estimateHigh: String(estimate.range.high),
    confidence: estimate.confidence,
    onboardingStatus: "pending",
    driveFolderId: driveFolder?.id || "",
    driveFolderUrl: driveFolder?.url || ""
  });

  estimates.push({
    estimateId: createId("est"),
    leadId: lead.leadId,
    createdAt: lead.createdAt,
    packageName: estimate.recommendedPackage,
    priceLow: String(estimate.range.low),
    priceHigh: String(estimate.range.high),
    monthlyLow: String(estimate.monthlyRange?.low || ""),
    monthlyHigh: String(estimate.monthlyRange?.high || ""),
    confidence: estimate.confidence,
    rationaleJson: json(estimate.rationale),
    addOnsJson: json(estimate.addOns),
    inputSnapshotJson: json(lead)
  });

  projects.push({
    projectId: createId("prj"),
    leadId: lead.leadId,
    createdAt: lead.createdAt,
    updatedAt: nowIso(),
    draftStatus: "queued",
    repoName: "",
    repoUrl: "",
    previewProvider: "",
    previewUrl: "",
    creativeBriefJson: "",
    siteSpecJson: "",
    artifactJson: "",
    draftRequestedAt: lead.createdAt,
    draftClaimedAt: "",
    draftCompletedAt: "",
    lastError: "",
    sendAt: "",
    approvedAt: ""
  });

  await writeRows("Leads", leads);
  await writeRows("Estimates", estimates);
  await writeRows("Projects", projects);
  await appendActivity({
    leadId: lead.leadId,
    stage: lead.stage,
    action: "lead_created",
    details: { email: lead.email, projectType: lead.projectType }
  });
}

export async function getLeadBundle(leadId) {
  const [leads, estimates, projects, approvals, emails, activities] = await Promise.all([
    getRows("Leads"),
    getRows("Estimates"),
    getRows("Projects"),
    getRows("Approvals"),
    getRows("Emails"),
    getRows("Activity Log")
  ]);

  const lead = leads.find((row) => row.leadId === leadId);
  if (!lead) {
    return null;
  }

  return {
    lead: hydrateLead(lead),
    estimate: hydrateEstimate(estimates.find((row) => row.leadId === leadId)),
    project: hydrateProject(projects.find((row) => row.leadId === leadId)),
    approvals: approvals.filter((row) => row.leadId === leadId),
    emails: emails.filter((row) => row.leadId === leadId).map(hydrateEmail),
    activities: activities.filter((row) => row.leadId === leadId).map(hydrateActivity)
  };
}

export async function updateLead(leadId, patch) {
  const leads = await getRows("Leads");
  const index = leads.findIndex((row) => row.leadId === leadId);
  if (index === -1) {
    return false;
  }

  leads[index] = { ...leads[index], ...patch, updatedAt: nowIso() };
  await writeRows("Leads", leads);
  return true;
}

export async function updateProject(leadId, patch) {
  const projects = await getRows("Projects");
  const index = projects.findIndex((row) => row.leadId === leadId);
  if (index === -1) {
    return false;
  }

  projects[index] = { ...projects[index], ...patch, updatedAt: nowIso() };
  await writeRows("Projects", projects);
  return true;
}

export async function upsertOnboarding(leadId, onboarding) {
  const leads = await getRows("Leads");
  const index = leads.findIndex((row) => row.leadId === leadId);
  if (index === -1) {
    return false;
  }

  const nextNotes = [leads[index].notes, onboarding.businessSummary, onboarding.offerSummary].filter(Boolean).join("\n\n");
  leads[index] = {
    ...leads[index],
    notes: nextNotes,
    onboardingStatus: "submitted",
    updatedAt: nowIso()
  };
  await writeRows("Leads", leads);
  await appendActivity({
    leadId,
    stage: leads[index].stage,
    action: "onboarding_submitted",
    details: onboarding
  });
  return true;
}

export async function createApproval({ leadId, token, channel = "slack", reviewer = "", notes = "" }) {
  const approvals = await getRows("Approvals");
  approvals.push({
    approvalId: createId("apr"),
    leadId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    decision: "pending",
    token,
    channel,
    reviewer,
    notes
  });
  await writeRows("Approvals", approvals);
}

export async function resolveApproval(token, decision, reviewer = "") {
  const approvals = await getRows("Approvals");
  const approval = approvals.find((row) => row.token === token);
  if (!approval) {
    return null;
  }

  approval.decision = decision;
  approval.reviewer = reviewer || approval.reviewer;
  approval.updatedAt = nowIso();
  await writeRows("Approvals", approvals);

  await updateProject(approval.leadId, {
    approvedAt: decision === "approved" ? nowIso() : "",
    sendAt: decision === "approved" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : ""
  });
  await updateLead(approval.leadId, { stage: decision === "approved" ? "approved_to_send" : "internal_review" });
  await appendActivity({
    leadId: approval.leadId,
    stage: decision === "approved" ? "approved_to_send" : "internal_review",
    action: `approval_${decision}`,
    details: { reviewer }
  });

  return approval;
}

export async function createEmailRecord(payload) {
  const emails = await getRows("Emails");
  const record = {
    emailId: createId("eml"),
    leadId: payload.leadId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    kind: payload.kind,
    recipient: payload.recipient,
    subject: payload.subject,
    bodyPreview: payload.bodyPreview || "",
    gmailDraftId: payload.gmailDraftId || "",
    gmailMessageId: payload.gmailMessageId || "",
    status: payload.status || "drafted",
    sendAt: payload.sendAt || "",
    sentAt: payload.sentAt || "",
    metadataJson: json(payload.metadata)
  };
  emails.push(record);
  await writeRows("Emails", emails);
  return record;
}

export async function updateEmailRecord(emailId, patch) {
  const emails = await getRows("Emails");
  const index = emails.findIndex((row) => row.emailId === emailId);
  if (index === -1) {
    return false;
  }

  emails[index] = { ...emails[index], ...patch, updatedAt: nowIso() };
  await writeRows("Emails", emails);
  return true;
}

export async function findQueuedProjects() {
  const projects = await getRows("Projects");
  return projects.filter((row) => ["queued", "retry"].includes(row.draftStatus)).map(hydrateProject);
}

export async function claimProject(leadId) {
  const projects = await getRows("Projects");
  const index = projects.findIndex((row) => row.leadId === leadId);
  if (index === -1 || !["queued", "retry"].includes(projects[index].draftStatus)) {
    return false;
  }

  projects[index].draftStatus = "processing";
  projects[index].draftClaimedAt = nowIso();
  projects[index].updatedAt = nowIso();
  await writeRows("Projects", projects);
  return true;
}

export async function findDueEmails(referenceDate = new Date()) {
  const emails = await getRows("Emails");
  return emails
    .filter((row) => row.status === "approved" && row.sendAt && new Date(row.sendAt) <= referenceDate)
    .map(hydrateEmail);
}

export async function listDashboardData() {
  const [leads, projects, emails] = await Promise.all([getRows("Leads"), getRows("Projects"), getRows("Emails")]);
  return {
    leads: leads.map(hydrateLead),
    projects: projects.map(hydrateProject),
    emails: emails.map(hydrateEmail)
  };
}

export async function appendActivity({ leadId, stage, action, details }) {
  const activity = await getRows("Activity Log");
  activity.push({
    activityId: createId("act"),
    leadId,
    createdAt: nowIso(),
    stage,
    action,
    detailsJson: json(details)
  });
  await writeRows("Activity Log", activity);
}
