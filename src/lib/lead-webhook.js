import { config } from "../config.js";

export async function sendLeadWebhook(event, payload) {
  if (!config.google.appsScriptWebhookUrl) {
    return { skipped: true };
  }

  const response = await fetch(config.google.appsScriptWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event,
      payload
    })
  });

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: text
  };
}
