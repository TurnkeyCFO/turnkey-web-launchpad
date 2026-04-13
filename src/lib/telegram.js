import { config, hasTelegram } from "../config.js";

export async function sendTelegramMessage(message) {
  if (!hasTelegram) {
    return { skipped: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text: message,
      disable_web_page_preview: false
    })
  });

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.description || "Telegram send failed");
  }

  return payload.result;
}
