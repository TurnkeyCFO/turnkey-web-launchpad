import { formatCurrency } from "./utils.js";

export function buildGeneratedSiteFiles({ lead, estimate, brief, polish }) {
  const headline = polish.headlineEdits?.heroHeadline || brief.heroHeadline;
  const subheadline = polish.headlineEdits?.heroSubheadline || brief.heroSubheadline;
  const primaryCta = polish.ctaEdits?.primaryCta || brief.primaryCta || "Start your project";
  const secondaryCta = polish.ctaEdits?.secondaryCta || brief.secondaryCta || "See the process";
  const services = brief.services || [];
  const process = brief.process || [];
  const faqs = brief.faqs || [];
  const proofPoints = brief.proofPoints || [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lead.company || "Client"} | Turnkey Web Draft</title>
  <meta name="description" content="${escapeHtml(subheadline)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div class="hero-badge">Turnkey Web first draft</div>
      <h1>${escapeHtml(headline)}</h1>
      <p class="hero-copy">${escapeHtml(subheadline)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#contact">${escapeHtml(primaryCta)}</a>
        <a class="btn btn-secondary" href="#process">${escapeHtml(secondaryCta)}</a>
      </div>
      <div class="proof-grid">
        ${proofPoints.map((item) => `<div class="proof-card">${escapeHtml(item)}</div>`).join("")}
      </div>
    </header>
    <main>
      <section class="section card-grid">
        ${services
          .map(
            (service) => `
          <article class="card">
            <div class="eyebrow">Offer</div>
            <h2>${escapeHtml(service.title)}</h2>
            <p>${escapeHtml(service.body)}</p>
          </article>`
          )
          .join("")}
      </section>
      <section class="section split">
        <article class="card">
          <div class="eyebrow">Why this draft exists</div>
          <h2>Built to move faster without the usual back-and-forth.</h2>
          <p>${escapeHtml(brief.offerSummary || "")}</p>
          <div class="quote-range">Estimated scope: ${formatCurrency(estimate.range.low)} - ${formatCurrency(estimate.range.high)}</div>
        </article>
        <article class="card" id="process">
          <div class="eyebrow">Process</div>
          <div class="stack">
            ${process
              .map(
                (step) => `
              <div class="process-item">
                <strong>${escapeHtml(step.title)}</strong>
                <p>${escapeHtml(step.body)}</p>
              </div>`
              )
              .join("")}
          </div>
        </article>
      </section>
      <section class="section faq-grid">
        ${faqs
          .map(
            (faq) => `
          <article class="card">
            <div class="eyebrow">FAQ</div>
            <h3>${escapeHtml(faq.question)}</h3>
            <p>${escapeHtml(faq.answer)}</p>
          </article>`
          )
          .join("")}
      </section>
      <section class="section final-cta card" id="contact">
        <div class="eyebrow">Next step</div>
        <h2>Share feedback directly and we will tighten the next pass.</h2>
        <p>This draft was prepared from your intake so we can align faster, gather any missing assets, and move toward launch without requiring a meeting as the first step.</p>
      </section>
    </main>
  </div>
</body>
</html>`;

  const css = `:root {
  --tk-navy: #00263A;
  --tk-navy-mid: #003A56;
  --tk-navy-soft: #0A4A6A;
  --tk-green: #00C85A;
  --tk-green-bright: #05DD69;
  --tk-green-soft: #5DD870;
  --tk-ice: #DAE1E9;
  --tk-ice-light: #EEF1F5;
  --tk-bg-light: #F2F5F8;
  --tk-white: #FFFFFF;
  --tk-text: #0D1F2D;
  --tk-text-soft: #36576A;
  --tk-border: rgba(0, 38, 58, 0.10);
  --shadow: 0 18px 40px rgba(7, 47, 69, 0.10);
  --radius: 24px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Plus Jakarta Sans", sans-serif;
  background: radial-gradient(circle at top right, rgba(0, 200, 90, 0.12), transparent 24%), linear-gradient(180deg, var(--tk-bg-light), var(--tk-white));
  color: var(--tk-text);
}
.shell { width: min(1160px, calc(100% - 24px)); margin: 18px auto 48px; }
.hero, .card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--tk-border);
  box-shadow: var(--shadow);
}
.hero { padding: 36px; }
.hero-badge, .eyebrow {
  display: inline-flex;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.hero-badge { color: var(--tk-navy-soft); margin-bottom: 14px; }
h1, h2, h3 { margin: 0 0 12px; line-height: 1; letter-spacing: -0.04em; }
h1 { font-size: clamp(40px, 7vw, 72px); max-width: 10ch; }
.hero-copy, p { color: var(--tk-text-soft); line-height: 1.75; }
.hero-copy { max-width: 640px; font-size: 18px; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
}
.btn-primary { background: linear-gradient(135deg, var(--tk-green-bright), var(--tk-green-soft)); color: var(--tk-navy); }
.btn-secondary { border: 1px solid var(--tk-border); color: var(--tk-navy); }
.proof-grid, .card-grid, .faq-grid, .split { display: grid; gap: 16px; }
.proof-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px; }
.proof-card, .card { padding: 22px; }
.card-grid, .faq-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.split { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.section { margin-top: 18px; }
.stack { display: grid; gap: 14px; }
.process-item strong { display: block; margin-bottom: 6px; }
.quote-range { margin-top: 18px; font-size: 22px; font-weight: 800; color: var(--tk-navy); }
@media (max-width: 880px) {
  .proof-grid, .card-grid, .faq-grid, .split { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .shell { width: min(100% - 16px, 100%); margin: 12px auto 24px; }
  .hero, .card { padding: 18px; border-radius: 22px; }
  .hero-actions .btn { width: 100%; }
}`;

  return [
    { path: "docs/index.html", content: html },
    { path: "docs/styles.css", content: css },
    { path: ".nojekyll", content: "" },
    {
      path: "README.md",
      content: `# ${lead.company || "Client"} website draft

This repository was generated by Turnkey Web.

- Lead: ${lead.company || `${lead.firstName} ${lead.lastName}`.trim()}
- Package: ${estimate.recommendedPackage}
- Estimate range: ${formatCurrency(estimate.range.low)} - ${formatCurrency(estimate.range.high)}
- Draft status: first iteration
`
    }
  ];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
