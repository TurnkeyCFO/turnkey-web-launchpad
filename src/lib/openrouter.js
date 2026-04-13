import { config, hasOpenRouter } from "../config.js";
import {
  buildAcknowledgementPrompt,
  buildClientDraftNotePrompt,
  buildCreativeBriefPrompt,
  buildPolishPrompt
} from "./prompt-bundles.js";

async function callModel({ model, prompt }) {
  if (!hasOpenRouter || !model) {
    return null;
  }

  const response = await fetch(`${config.openrouter.apiBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      "Content-Type": "application/json",
      ...(config.openrouter.httpReferer ? { "HTTP-Referer": config.openrouter.httpReferer } : {}),
      ...(config.openrouter.appTitle ? { "X-Title": config.openrouter.appTitle } : {})
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    })
  });

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  return JSON.parse(content);
}

function fallbackBrief(input) {
  return {
    positioning: `${input.company || "This business"} needs a polished website that makes the offer clearer and easier to trust.`,
    heroHeadline: `A cleaner website for ${input.company || "your business"}.`,
    heroSubheadline: "Built to explain the offer quickly, look credible, and move the right visitors toward action.",
    primaryCta: "Request your estimate",
    secondaryCta: "See the process",
    audienceSummary: input.industry || "Small business buyers",
    proofPoints: ["Fast first draft", "Clear positioning", "Async workflow"],
    services: [
      { title: "Sharper positioning", body: "Clarify what the business does and why the visitor should trust it quickly." },
      { title: "Conversion-focused layout", body: "Keep the page simple, strong, and oriented toward a next step." },
      { title: "Built for iteration", body: "Use the first draft to align quickly and revise with less friction." }
    ],
    process: [
      { title: "Interpret the intake", body: "Turn the intake into a practical brief and launch angle." },
      { title: "Build the first draft", body: "Create a live preview before the project gets stuck in planning." },
      { title: "Tighten and launch", body: "Use async feedback to refine copy, visuals, and calls to action." }
    ],
    faqs: [
      { question: "Do we need a meeting to start?", answer: "No. This process is designed to move forward from structured async input." },
      { question: "Can this draft change?", answer: "Yes. The draft is meant to accelerate alignment, not freeze the final direction." }
    ],
    copyNotes: ["Show credibility early", "Keep sentences short", "Make the CTA obvious"],
    offerSummary: "Async-first website execution with fast drafts and clear next steps."
  };
}

function fallbackPolish(brief) {
  return {
    headlineEdits: {
      heroHeadline: brief.heroHeadline,
      heroSubheadline: brief.heroSubheadline
    },
    ctaEdits: {
      primaryCta: brief.primaryCta,
      secondaryCta: brief.secondaryCta
    },
    riskFlags: [],
    internalNotes: ["Model polish unavailable, using deterministic fallback copy review."],
    clientNoteAngle: "Lead with speed, clarity, and the value of reviewing a real draft."
  };
}

function fallbackAcknowledgement(lead, estimate) {
  return {
    subject: `Your Turnkey Web estimate for ${lead.company || "your project"}`,
    body: `Hi ${lead.firstName || "there"},\n\nThanks for sending over your website request. Based on the details you shared, the likely scope currently lands around ${estimate.formattedRange}.\n\nWe are already turning your intake into a first draft direction. If you have logos, copy, photos, testimonials, or examples you like, you can add them through the onboarding link when convenient.\n\nWe will keep this moving asynchronously so you do not need a meeting just to get momentum started.\n\nBest,\n${config.ownerName}`
  };
}

function fallbackClientDraftNote(payload) {
  return {
    subject: `First website draft for ${payload.company || "your business"}`,
    body: `Hi ${payload.firstName || "there"},\n\nI pulled together a first draft based on what you shared. Here is the preview link:\n${payload.previewUrl}\n\nWhen you review it, I would start with the headline, the offer clarity, and whether the page feels like the business you want prospects to understand quickly.\n\nIf anything feels off, send me notes asynchronously and I will tighten the next pass.\n\nBest,\n${config.ownerName}`
  };
}

export async function generateCreativePackage(input) {
  const strategy =
    (await callModel({
      model: config.openrouter.secondaryAgentModel,
      prompt: buildCreativeBriefPrompt(input)
    })) || fallbackBrief(input);

  const polish =
    (await callModel({
      model: config.openrouter.primaryAgentModel,
      prompt: buildPolishPrompt(strategy)
    })) || fallbackPolish(strategy);

  return { strategy, polish };
}

export async function generateAcknowledgementEmail(lead, estimate) {
  return (
    (await callModel({
      model: config.openrouter.secondaryAgentModel || config.openrouter.primaryAgentModel,
      prompt: buildAcknowledgementPrompt({ lead, estimate })
    })) || fallbackAcknowledgement(lead, estimate)
  );
}

export async function generateClientDraftNote(payload) {
  return (
    (await callModel({
      model: config.openrouter.primaryAgentModel || config.openrouter.secondaryAgentModel,
      prompt: buildClientDraftNotePrompt(payload)
    })) || fallbackClientDraftNote(payload)
  );
}
