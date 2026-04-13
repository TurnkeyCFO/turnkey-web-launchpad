import crypto from "node:crypto";
import { config, hasSlack } from "../config.js";

const slackApi = "https://slack.com/api";

async function slackFetch(method, payload) {
  const response = await fetch(`${slackApi}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.slack.botToken}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.ok) {
    throw new Error(json.error || `Slack API error calling ${method}`);
  }

  return json;
}

export async function sendApprovalMessage({ lead, approvalToken, previewUrl, repoUrl, clientDraftSubject }) {
  if (!hasSlack) {
    return { skipped: true };
  }

  const approveUrl = `${config.approvalBaseUrl}/approve/${approvalToken}?decision=approved`;
  const rejectUrl = `${config.approvalBaseUrl}/approve/${approvalToken}?decision=rejected`;
  const text = [
    `New Turnkey Web draft ready for ${lead.company || lead.firstName}.`,
    `Preview: ${previewUrl || "Pending"}`,
    `Repo: ${repoUrl || "Pending"}`,
    `Client draft email: ${clientDraftSubject || "Pending"}`,
    `Approve: ${approveUrl}`,
    `Reject: ${rejectUrl}`
  ].join("\n");

  return slackFetch("chat.postMessage", {
    channel: config.slack.approvalChannel,
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Turnkey Web draft ready*\n*Lead:* ${lead.company || lead.firstName}\n*Email:* ${lead.email}\n*Preview:* ${previewUrl || "Pending"}\n*Repo:* ${repoUrl || "Pending"}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Approve" },
            style: "primary",
            action_id: "approve_turnkey_web_draft",
            value: JSON.stringify({ token: approvalToken, decision: "approved" })
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Reject" },
            style: "danger",
            action_id: "reject_turnkey_web_draft",
            value: JSON.stringify({ token: approvalToken, decision: "rejected" })
          }
        ]
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `Fallback approve link: ${approveUrl} | Fallback reject link: ${rejectUrl}` }]
      }
    ]
  });
}

export function verifySlackSignature({ rawBody, timestamp, signature }) {
  if (!config.slack.signingSecret || !rawBody || !timestamp || !signature) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${crypto.createHmac("sha256", config.slack.signingSecret).update(baseString).digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
