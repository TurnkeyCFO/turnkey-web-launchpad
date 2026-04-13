import { config, hasGmail } from "../config.js";
import { getGmailClient } from "./google.js";
import { createId, truncate } from "./utils.js";

function base64Encode(input) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function buildMime({ to, from, subject, body }) {
  return [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body
  ].join("\r\n");
}

export async function sendEmail({ to, subject, body }) {
  if (!hasGmail) {
    return { id: createId("msg"), skipped: true };
  }

  const gmail = getGmailClient();
  const raw = base64Encode(buildMime({ to, from: config.google.gmailFromEmail, subject, body }));
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw }
  });
  return { id: response.data.id, skipped: false };
}

export async function createDraft({ to, subject, body }) {
  if (!hasGmail) {
    return { id: createId("draft"), messageId: createId("msg"), skipped: true };
  }

  const gmail = getGmailClient();
  const raw = base64Encode(buildMime({ to, from: config.google.gmailFromEmail, subject, body }));
  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: { raw }
    }
  });

  return {
    id: response.data.id,
    messageId: response.data.message?.id || "",
    skipped: false
  };
}

export async function sendDraft(draftId) {
  if (!hasGmail) {
    return { id: draftId, skipped: true };
  }

  const gmail = getGmailClient();
  const response = await gmail.users.drafts.send({
    userId: "me",
    requestBody: { id: draftId }
  });

  return { id: response.data.id, skipped: false };
}

export function previewBody(body) {
  return truncate(body, 160);
}
