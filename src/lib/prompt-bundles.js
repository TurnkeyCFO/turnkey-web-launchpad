export const PROMPT_VERSION = "tw-v1.0";

export const houseStyleBundle = {
  version: PROMPT_VERSION,
  brand: "Turnkey Web",
  positioning: [
    "Async-first website execution for small businesses",
    "Clear scope, fast drafts, operator-minded handoff",
    "Premium but practical presentation with conversion focus"
  ],
  designRules: [
    "Use Turnkey navy, green, and clean neutral backgrounds",
    "Favor bold headlines, light-mode presentation, and executive clarity",
    "Do not use generic agency clichés or purple SaaS visuals",
    "Emphasize trust, clarity, responsiveness, and visible calls to action"
  ],
  processRules: [
    "Lead with business outcome before design flourishes",
    "Make the first screen instantly credible",
    "Keep page structure simple enough to ship fast and revise fast",
    "Never depend on a meeting to move the project forward"
  ]
};

export function buildCreativeBriefPrompt(input) {
  return `
You are OpenClaw helping Turnkey Web synthesize intake into a compact website brief.

Return valid JSON with this shape:
{
  "positioning": "string",
  "heroHeadline": "string",
  "heroSubheadline": "string",
  "primaryCta": "string",
  "secondaryCta": "string",
  "audienceSummary": "string",
  "proofPoints": ["string"],
  "services": [{"title":"string","body":"string"}],
  "process": [{"title":"string","body":"string"}],
  "faqs": [{"question":"string","answer":"string"}],
  "copyNotes": ["string"],
  "offerSummary": "string"
}

Keep it practical, conversion-oriented, and ready for deterministic rendering.

INTAKE
${JSON.stringify(input, null, 2)}
`.trim();
}

export function buildPolishPrompt(input) {
  return `
You are Codex reviewing a draft website brief before it becomes a shipped first draft.

Return valid JSON with this shape:
{
  "headlineEdits": {
    "heroHeadline": "string",
    "heroSubheadline": "string"
  },
  "ctaEdits": {
    "primaryCta": "string",
    "secondaryCta": "string"
  },
  "riskFlags": ["string"],
  "internalNotes": ["string"],
  "clientNoteAngle": "string"
}

Prioritize trust, clarity, and fast implementation. Avoid buzzwords.

DRAFT
${JSON.stringify(input, null, 2)}
`.trim();
}

export function buildAcknowledgementPrompt(input) {
  return `
Write a warm, concise acknowledgment email for a new Turnkey Web lead.

Return valid JSON:
{
  "subject": "string",
  "body": "string"
}

Use the lead's scope, reassure them that a first draft is in motion, ask for any helpful assets, and keep the tone polished but direct.

LEAD
${JSON.stringify(input, null, 2)}
`.trim();
}

export function buildClientDraftNotePrompt(input) {
  return `
Write a short client-facing email note that sounds like the founder wrote it personally.

Return valid JSON:
{
  "subject": "string",
  "body": "string"
}

The email should:
- reference the client's stated goals
- introduce the first draft link
- explain what to review first
- invite async feedback
- avoid sounding automated

INPUT
${JSON.stringify(input, null, 2)}
`.trim();
}
