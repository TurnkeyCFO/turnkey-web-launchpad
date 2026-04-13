import crypto from "node:crypto";
import { config } from "../config.js";
import {
  appendActivity,
  claimProject,
  createApproval,
  createEmailRecord,
  createLeadBundle,
  findDueEmails,
  findQueuedProjects,
  getLeadBundle,
  initializeCrm,
  resolveApproval,
  updateEmailRecord,
  updateLead,
  updateProject,
  upsertOnboarding
} from "./crm.js";
import { createLeadFolder, uploadLeadAssets } from "./drive.js";
import { createDraft, previewBody, sendDraft, sendEmail } from "./gmail.js";
import { provisionDraftRepo } from "./github.js";
import { sendLeadWebhook } from "./lead-webhook.js";
import { generateAcknowledgementEmail, generateClientDraftNote, generateCreativePackage } from "./openrouter.js";
import { computeEstimate } from "./pricing.js";
import { sendApprovalMessage } from "./slack.js";
import { sendTelegramMessage } from "./telegram.js";
import { buildGeneratedSiteFiles } from "./website-renderer.js";
import { addDaysIso, createId, nowIso, sortBy } from "./utils.js";

export async function bootstrapApp() {
  return initializeCrm();
}

export async function submitEstimate(input) {
  const createdAt = nowIso();
  const lead = {
    leadId: createId("lead"),
    createdAt,
    stage: "estimated",
    firstName: input.firstName?.trim() || "",
    lastName: input.lastName?.trim() || "",
    email: input.email?.trim().toLowerCase() || "",
    company: input.company?.trim() || "",
    phone: input.phone?.trim() || "",
    industry: input.industry?.trim() || "",
    currentSiteUrl: input.currentSiteUrl?.trim() || "",
    projectType: input.projectType,
    timeline: input.timeline,
    budgetBand: input.budgetBand,
    pageCountBand: input.pageCountBand,
    goals: input.goals || [],
    features: input.features || [],
    notes: input.notes?.trim() || ""
  };

  const estimate = computeEstimate({
    ...lead,
    projectTypeLabel: input.projectTypeLabel
  });
  const driveFolder = await createLeadFolder(lead);

  await createLeadBundle({ lead, estimate, driveFolder });
  await updateLead(lead.leadId, { stage: "estimated" });

  const email = await generateAcknowledgementEmail(lead, estimate);
  await sendEmail({
    to: lead.email,
    subject: email.subject,
    body: `${email.body}\n\nOnboarding link: ${config.appBaseUrl}/onboarding.html?leadId=${lead.leadId}`
  });
  await createEmailRecord({
    leadId: lead.leadId,
    kind: "acknowledgement",
    recipient: lead.email,
    subject: email.subject,
    bodyPreview: previewBody(email.body),
    status: "sent",
    metadata: { onboardingUrl: `${config.appBaseUrl}/onboarding.html?leadId=${lead.leadId}` }
  });

  await appendActivity({
    leadId: lead.leadId,
    stage: "estimated",
    action: "acknowledgement_sent",
    details: { subject: email.subject }
  });
  await sendLeadWebhook("estimate_submitted", {
    lead,
    estimate,
    onboardingUrl: `${config.appBaseUrl}/onboarding.html?leadId=${lead.leadId}`,
    driveFolder
  }).catch(() => null);

  return {
    leadId: lead.leadId,
    estimate,
    onboardingUrl: `/onboarding.html?leadId=${lead.leadId}`,
    driveFolderUrl: driveFolder?.url || ""
  };
}

export async function submitOnboarding({ fields, files }) {
  const leadId = fields.leadId;
  const bundle = await getLeadBundle(leadId);
  if (!bundle) {
    throw new Error("Lead not found");
  }

  const uploads = await uploadLeadAssets(bundle.lead.driveFolderId || leadId, files);
  const onboarding = {
    businessSummary: fields.businessSummary || "",
    offerSummary: fields.offerSummary || "",
    tone: fields.tone || "",
    competitors: splitField(fields.competitors),
    inspirationSites: splitField(fields.inspirationSites),
    seoPriorities: splitField(fields.seoPriorities),
    integrations: splitField(fields.integrations),
    testimonials: fields.testimonials || "",
    offers: fields.offers || "",
    assetCount: uploads.length,
    uploadNames: uploads.map((file) => file.name)
  };

  await upsertOnboarding(leadId, onboarding);
  await updateLead(leadId, { stage: "ready_for_draft", onboardingStatus: "submitted" });
  await updateProject(leadId, { draftStatus: "queued" });
  await sendLeadWebhook("onboarding_submitted", {
    leadId,
    onboarding,
    uploads
  }).catch(() => null);

  return { leadId, uploads };
}

export async function processQueuedDrafts({ limit = 1 } = {}) {
  const queued = sortBy(await findQueuedProjects(), (project) => project.createdAt).slice(0, limit);
  const results = [];

  for (const project of queued) {
    const claimed = await claimProject(project.leadId);
    if (!claimed) {
      continue;
    }

    try {
      results.push(await generateDraftForLead(project.leadId));
    } catch (error) {
      await updateProject(project.leadId, {
        draftStatus: "retry",
        lastError: error instanceof Error ? error.message : String(error)
      });
      await appendActivity({
        leadId: project.leadId,
        stage: "draft_in_progress",
        action: "draft_failed",
        details: { error: error instanceof Error ? error.message : String(error) }
      });
      results.push({ leadId: project.leadId, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return results;
}

async function generateDraftForLead(leadId) {
  const bundle = await getLeadBundle(leadId);
  if (!bundle) {
    throw new Error("Lead bundle not found");
  }

  await updateLead(leadId, { stage: "draft_in_progress" });

  const briefInput = {
    leadId,
    company: bundle.lead.company,
    firstName: bundle.lead.firstName,
    industry: bundle.lead.industry,
    projectType: bundle.lead.projectType,
    goals: bundle.lead.goals,
    features: bundle.lead.features,
    notes: bundle.lead.notes,
    estimateRange: `${bundle.estimate?.priceLow || ""}-${bundle.estimate?.priceHigh || ""}`
  };

  const creative = await generateCreativePackage(briefInput);
  const files = buildGeneratedSiteFiles({
    lead: bundle.lead,
    estimate: bundle.estimate,
    brief: creative.strategy,
    polish: creative.polish
  });
  const repo = await provisionDraftRepo({
    lead: bundle.lead,
    files
  });

  const draftNote = await generateClientDraftNote({
    firstName: bundle.lead.firstName,
    company: bundle.lead.company,
    previewUrl: repo.previewUrl || repo.repoUrl,
    projectType: bundle.lead.projectType,
    goals: bundle.lead.goals
  });

  const gmailDraft = await createDraft({
    to: bundle.lead.email,
    subject: draftNote.subject,
    body: draftNote.body
  });

  const approvalToken = crypto.randomUUID();
  await createApproval({ leadId, token: approvalToken, channel: "slack" });
  await updateProject(leadId, {
    draftStatus: "internal_review",
    repoName: repo.name,
    repoUrl: repo.repoUrl,
    previewProvider: repo.provider,
    previewUrl: repo.previewUrl,
    creativeBriefJson: JSON.stringify(creative.strategy),
    siteSpecJson: JSON.stringify(creative.polish),
    artifactJson: JSON.stringify({ files: files.map((file) => file.path) }),
    draftCompletedAt: nowIso()
  });
  await updateLead(leadId, { stage: "internal_review" });

  const emailRecord = await createEmailRecord({
    leadId,
    kind: "client_draft",
    recipient: bundle.lead.email,
    subject: draftNote.subject,
    bodyPreview: previewBody(draftNote.body),
    gmailDraftId: gmailDraft.id,
    gmailMessageId: gmailDraft.messageId,
    status: "awaiting_approval",
    metadata: {
      previewUrl: repo.previewUrl,
      repoUrl: repo.repoUrl
    }
  });

  const internalSummary = [
    `Turnkey Web draft ready for ${bundle.lead.company || bundle.lead.firstName}`,
    `Lead email: ${bundle.lead.email}`,
    `Preview: ${repo.previewUrl || "Not available yet"}`,
    `Repo: ${repo.repoUrl}`,
    `Client draft subject: ${draftNote.subject}`
  ].join("\n");

  await sendTelegramMessage(internalSummary);
  await sendEmail({
    to: config.ownerEmail || bundle.lead.email,
    subject: `Internal review: ${bundle.lead.company || bundle.lead.firstName} draft ready`,
    body: `${internalSummary}\n\nApproval route: ${config.approvalBaseUrl}/approve/${approvalToken}?decision=approved`
  });
  await sendApprovalMessage({
    lead: bundle.lead,
    approvalToken,
    previewUrl: repo.previewUrl,
    repoUrl: repo.repoUrl,
    clientDraftSubject: draftNote.subject
  });
  await appendActivity({
    leadId,
    stage: "internal_review",
    action: "draft_ready_for_review",
    details: { repoUrl: repo.repoUrl, previewUrl: repo.previewUrl, emailId: emailRecord.emailId }
  });
  await sendLeadWebhook("draft_ready", {
    leadId,
    repoUrl: repo.repoUrl,
    previewUrl: repo.previewUrl,
    subject: draftNote.subject
  }).catch(() => null);

  return {
    leadId,
    ok: true,
    repoUrl: repo.repoUrl,
    previewUrl: repo.previewUrl
  };
}

export async function applyApprovalDecision(token, decision, reviewer = "Slack") {
  const approval = await resolveApproval(token, decision, reviewer);
  if (!approval) {
    return null;
  }

  const bundle = await getLeadBundle(approval.leadId);
  if (!bundle) {
    return approval;
  }

  const draftEmail = bundle.emails.find((email) => email.kind === "client_draft");
  if (draftEmail && decision === "approved") {
    const scheduledFor = addDaysIso(bundle.lead.createdAt, 3);
    await updateEmailRecord(draftEmail.emailId, {
      status: "approved",
      sendAt: scheduledFor
    });
    await updateProject(approval.leadId, { sendAt: scheduledFor });
    await sendLeadWebhook("draft_approved", {
      leadId: approval.leadId,
      sendAt: scheduledFor
    }).catch(() => null);
  }

  return approval;
}

export async function processDueEmails() {
  const dueEmails = await findDueEmails(new Date());
  const sent = [];

  for (const email of dueEmails) {
    const result = await sendDraft(email.gmailDraftId);
    await updateEmailRecord(email.emailId, {
      status: "sent",
      gmailMessageId: result.id,
      sentAt: nowIso()
    });
    await updateLead(email.leadId, { stage: "sent" });
    await appendActivity({
      leadId: email.leadId,
      stage: "sent",
      action: "draft_email_sent",
      details: { emailId: email.emailId, messageId: result.id }
    });
    await sendLeadWebhook("draft_email_sent", {
      leadId: email.leadId,
      emailId: email.emailId,
      messageId: result.id
    }).catch(() => null);
    sent.push({ emailId: email.emailId, messageId: result.id });
  }

  return sent;
}

function splitField(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
