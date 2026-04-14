const packageMatrix = {
  "landing-page-sprint": { base: 500, band: 300, monthlyLow: 0, monthlyHigh: 0 },
  "business-website-build": { base: 1000, band: 400, monthlyLow: 0, monthlyHigh: 0 },
  "website-refresh": { base: 500, band: 300, monthlyLow: 0, monthlyHigh: 0 },
  "website-care-plan": { base: 100, band: 150, monthlyLow: 100, monthlyHigh: 250 }
};

const pageCountAdjustments = {
  "1 page": 0,
  "2-3 pages": 0,
  "4-5 pages": 300,
  "6-8 pages": 850,
  "9+ pages": 1400
};

const featureAdjustments = {
  "Contact forms": 0,
  "Calendar booking": 0,
  "Blog/resources": 0,
  "Portfolio/case studies": 0,
  "Testimonials": 0,
  "Quote request flow": 0,
  "CRM/email integration": 200,
  "Analytics and tracking": 0,
  "Local SEO pages": 300,
  "E-commerce / payments": 700
};

const goalAdjustments = {
  "Generate leads": 0,
  "Look more credible": 0,
  "Book appointments": 0,
  "Launch paid ads": 100,
  "Improve SEO/local discovery": 0,
  "Refresh branding": 100
};

const timelineAdjustments = {
  "ASAP (under 2 weeks)": 200,
  "This month": 100,
  "Next 30-60 days": 0,
  "Flexible / planning ahead": 0
};

const quoteForm = document.getElementById("estimate-form");
const statusNode = document.getElementById("estimate-form-status");
const estimateCard = document.getElementById("estimate-result");
const successPanel = document.getElementById("estimate-success-panel");
const offerDialog = successPanel?.querySelector(".offer-letter-shell");
const offerCloseButton = document.getElementById("offer-close");
const emailInput = document.getElementById("email");
const isStaticMode = window.location.hostname.includes("github.io");
const OFFER_STORAGE_KEY = "turnkey-web-offer-data";
let estimateUnlocked = false;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function roundTo50(value) {
  return Math.max(0, Math.round(Number(value || 0) / 50) * 50);
}

function applyPublicCeiling(range, projectType, pageCountBand) {
  if (projectType === "website-care-plan") {
    return range;
  }

  if (!["1 page", "2-3 pages", "4-5 pages"].includes(pageCountBand) || range.high <= 3500) {
    return range;
  }

  const overflow = range.high - 3500;
  return {
    low: roundTo50(Math.max(0, range.low - overflow)),
    high: 3500
  };
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function collectMultiSelect(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function humanizeProjectType(value) {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function getPayload() {
  if (!quoteForm) {
    return null;
  }

  const formData = new FormData(quoteForm);
  const payload = Object.fromEntries(formData.entries());
  payload.goals = collectMultiSelect("goals");
  payload.features = collectMultiSelect("features");
  return payload;
}

function computeEstimate(payload) {
  const projectType = payload.projectType || "business-website-build";
  const pageCountBand = payload.pageCountBand || "2-3 pages";
  const selectedFeatures = payload.features || [];
  const selectedGoals = payload.goals || [];
  const timeline = payload.timeline || "Next 30-60 days";

  const base = packageMatrix[projectType] || packageMatrix["business-website-build"];
  const pageAdjustment = pageCountAdjustments[pageCountBand] || 0;
  const timelineAdjustment = timelineAdjustments[timeline] || 0;

  let price = base.base + pageAdjustment + timelineAdjustment;

  selectedFeatures.forEach((feature) => {
    price += featureAdjustments[feature] || 0;
  });

  selectedGoals.forEach((goal) => {
    price += goalAdjustments[goal] || 0;
  });

  const pricedAddOns = selectedFeatures.filter((feature) => featureAdjustments[feature] > 0);
  const complexitySignals = [
    pricedAddOns.length > 0,
    selectedGoals.includes("Launch paid ads"),
    selectedGoals.includes("Refresh branding"),
    pageCountBand === "6-8 pages",
    pageCountBand === "9+ pages"
  ].filter(Boolean).length;

  let band = base.band || 400;
  if (projectType === "website-care-plan") {
    band = 150;
  } else if (selectedFeatures.includes("E-commerce / payments") || pageCountBand === "9+ pages") {
    band = 500;
  } else if (complexitySignals >= 2) {
    band = 400;
  }

  const range = applyPublicCeiling(
    {
      low: roundTo50(price),
      high: roundTo50(price + band)
    },
    projectType,
    pageCountBand
  );
  const addOns = [];

  if (selectedGoals.includes("Improve SEO/local discovery")) {
    addOns.push("SEO foundations included");
    if (!selectedFeatures.includes("Local SEO pages") && projectType !== "website-care-plan") {
      addOns.push("Local SEO page set recommended");
    }
  }
  if (selectedFeatures.includes("CRM/email integration")) {
    addOns.push("CRM integration");
  }
  if (selectedFeatures.includes("Local SEO pages")) {
    addOns.push("Local SEO page set");
  }
  if (selectedFeatures.includes("E-commerce / payments")) {
    addOns.push("Payments setup");
  }
  if (selectedGoals.includes("Launch paid ads")) {
    addOns.push("Campaign landing page support");
  }
  if (selectedGoals.includes("Refresh branding")) {
    addOns.push("Brand polish");
  }
  if (timeline === "ASAP (under 2 weeks)") {
    addOns.push("Rush delivery");
  }
  if (projectType === "website-care-plan" && selectedGoals.includes("Improve SEO/local discovery")) {
    addOns.push("Monthly SEO tune-ups");
  }

  const confidence = projectType === "website-care-plan" || band <= 450 ? "high" : "medium";

  return {
    range,
    recommendedPackage: humanizeProjectType(projectType),
    formattedRange: `${formatCurrency(range.low)} - ${formatCurrency(range.high)}`,
    confidence,
    addOns,
    rationale: [
      `${humanizeProjectType(projectType)} starting point`,
      pageCountBand === "2-3 pages" ? "up to 3 pages included" : pageCountBand,
      pricedAddOns.length ? `${pricedAddOns.length} priced add-on${pricedAddOns.length === 1 ? "" : "s"}` : "standard features included"
    ],
    monthlyRange: base.monthlyLow || base.monthlyHigh ? { low: base.monthlyLow, high: base.monthlyHigh } : null
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTierOptions(estimate, payload) {
  const isCarePlan = payload.projectType === "website-care-plan";
  const pageSummary = payload.pageCountBand === "2-3 pages" ? "Up to 3 pages in the standard scope" : `${payload.pageCountBand} scope`;
  const needsSeoDepth = payload.goals.includes("Improve SEO/local discovery") || payload.features.includes("Local SEO pages");
  const needsCampaignSupport = payload.goals.includes("Launch paid ads");
  const hasPayments = payload.features.includes("E-commerce / payments");
  const featuredPoint = needsSeoDepth
    ? "More room for SEO depth and stronger service structure"
    : needsCampaignSupport
      ? "More room for campaign support and stronger conversion flow"
      : hasPayments
        ? "More room for checkout, payments, and trust-building structure"
        : "More room for proof, polish, and stronger page flow";

  if (isCarePlan) {
    const low = estimate.monthlyRange?.low || estimate.range.low;
    const high = estimate.monthlyRange?.high || estimate.range.high;
    const mid = roundTo50((low + high) / 2);
    return [
      {
        badge: "Lean monthly support",
        name: "Essential Care",
        priceLabel: `${formatCurrency(low)}/mo`,
        fit: "Best for businesses that mainly need updates, upkeep, and light SEO support.",
        summary: "Reliable monthly upkeep for businesses that want the site looked after without a big retainer.",
        points: [
          "Core updates, routine maintenance, and light monthly improvements",
          "Best when you mostly need support, edits, and simple SEO tune-ups",
          "A good fit when the site already has a solid foundation"
        ]
      },
      {
        badge: "Most balanced",
        name: "Growth Care",
        priceLabel: `${formatCurrency(mid)}/mo`,
        fit: "Best for businesses that want steady improvements without a heavy retainer.",
        summary: "The strongest balance of monthly support, iterative improvements, and growth-focused website upkeep.",
        points: [
          "Faster turnaround on edits and more room for ongoing improvements",
          needsSeoDepth ? "Includes more consistent SEO-focused page and content work" : "Includes more room for conversion and proof refinements",
          "Best for businesses that want the site to keep getting sharper over time"
        ]
      },
      {
        badge: "Most complete",
        name: "Priority Care",
        priceLabel: `${formatCurrency(high)}/mo`,
        fit: "Best for businesses that want a more proactive website partner each month.",
        summary: "The most hands-on option for businesses that want priority support and a more proactive monthly website partner.",
        points: [
          "Highest level of support, refinements, and strategic monthly attention",
          needsSeoDepth ? "More proactive SEO improvements and growth-focused updates" : "More proactive polish, conversion improvements, and faster support",
          "Best when the website is an active part of how the business grows"
        ]
      }
    ];
  }

  const low = estimate.range.low;
  const high = estimate.range.high;
  const mid = roundTo50((low + high) / 2);

  return [
    {
      badge: "Leanest path",
      name: "Launch",
      priceLabel: formatCurrency(low),
      fit: "Best for getting live quickly with the essentials handled well.",
      summary: "A clean, credible launch with the essentials in place and a tighter scope.",
      points: [
        pageSummary,
        "Core messaging, mobile layout, and clear contact or booking path",
        "Best when you want to get live fast and look more established online"
      ]
    },
    {
      badge: "Most balanced",
      name: "Growth",
      priceLabel: formatCurrency(mid),
      fit: "Best for most small businesses that need stronger trust and conversion support.",
      summary: "The strongest balance of polish, proof, and conversion support for most small businesses.",
      points: [
        pageSummary,
        "More proof, stronger page flow, and better conversion polish throughout",
        featuredPoint
      ]
    },
    {
      badge: "Most complete",
      name: "Authority",
      priceLabel: formatCurrency(high),
      fit: "Best for businesses where trust, depth, or complexity matter more.",
      summary: "The most developed version of the same project, with more refinement, depth, and strategic polish.",
      points: [
        pageSummary,
        "The deepest version of the design, messaging, and trust structure",
        needsCampaignSupport ? "Best when the site also needs campaign-ready or ad-ready support" : featuredPoint
      ]
    }
  ];
}

function renderTierOptions(tiers) {
  const container = document.getElementById("offer-tier-grid");
  if (!container) {
    return;
  }

  container.innerHTML = tiers.map((tier, index) => `
    <article class="offer-tier${index === 1 ? " offer-tier-featured" : ""}">
      ${index === 1 ? '<div class="tier-highlight">Recommended</div>' : ""}
      <div class="tier-topline">
        <span class="tier-step">Option ${String(index + 1).padStart(2, "0")}</span>
        <div class="tier-badge">${escapeHtml(tier.badge)}</div>
      </div>
      <div class="tier-head">
        <div class="tier-title-block">
          <h4>${escapeHtml(tier.name)}</h4>
          <p class="tier-summary">${escapeHtml(tier.summary)}</p>
        </div>
        <div class="tier-price-block">
          <span class="tier-price-prefix">Starting at</span>
          <div class="tier-price">${escapeHtml(tier.priceLabel)}</div>
        </div>
      </div>
      <div class="tier-fit">${escapeHtml(tier.fit || "")}</div>
      <ul>
        ${tier.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function persistOfferData(data) {
  try {
    window.localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Unable to persist offer data", error);
  }
}

function readOfferData() {
  try {
    const raw = window.localStorage.getItem(OFFER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to read offer data", error);
    return null;
  }
}

function launchOfferPage(data) {
  persistOfferData(data);
  const nextUrl = new URL("./offer.html", window.location.href);
  window.location.href = nextUrl.toString();
}

function openOfferExperience() {
  if (!successPanel) {
    return;
  }

  successPanel.classList.remove("hidden");
  successPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("offer-open");

  window.requestAnimationFrame(() => {
    successPanel.classList.add("is-visible");
    offerDialog?.focus();
  });
}

function closeOfferExperience() {
  if (!successPanel) {
    return;
  }

  successPanel.classList.remove("is-visible");
  successPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("offer-open");

  window.setTimeout(() => {
    if (!successPanel.classList.contains("is-visible")) {
      successPanel.classList.add("hidden");
    }
  }, 420);
}

function updateChoicePills() {
  document.querySelectorAll(".choice-pill").forEach((pill) => {
    const input = pill.querySelector("input");
    pill.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function updateLockState() {
  const hasValidEmail = validEmail(emailInput?.value);
  const unlocked = estimateUnlocked && hasValidEmail;
  estimateCard?.classList.toggle("locked", !unlocked);
  if (statusNode) {
    if (!hasValidEmail) {
      statusNode.textContent = "Enter a valid email, then press Complete estimate to reveal your three quote options.";
    } else if (!estimateUnlocked) {
      statusNode.textContent = "Press Complete estimate to open your custom quote page.";
    } else {
      statusNode.textContent = "Your custom quote page is ready.";
    }
  }
  return unlocked;
}

function renderPreview(payload) {
  const estimate = computeEstimate(payload);
  setText("preview-package", estimate.recommendedPackage);
  setText("preview-range", estimate.formattedRange);
  setText("preview-confidence", estimate.confidence.toUpperCase());
  setText("preview-pages", payload.pageCountBand || "2-3 pages");
  setText("preview-timeline", payload.timeline || "Next 30-60 days");
  setText("preview-goals-count", String(payload.goals.length));
  setText("preview-features-count", String(payload.features.length));
  setText("preview-addons", estimate.addOns.length ? estimate.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("preview-rationale", estimate.rationale.join(" - "));
  setText(
    "preview-monthly",
    estimate.monthlyRange
      ? `Monthly guidance ${formatCurrency(estimate.monthlyRange.low)} - ${formatCurrency(estimate.monthlyRange.high)}`
      : "One-time project range"
  );
  return estimate;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

function activateTab(name, options = {}) {
  const { syncHash = false } = options;
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.tabTarget === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${name}`);
  });

  if (syncHash && window.location.pathname.toLowerCase().includes("pricing")) {
    const nextHash = name === "quote" ? "#quote" : "#pricing";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }
}

function activateTabFromLocation() {
  const hash = String(window.location.hash || "").replace("#", "").toLowerCase();
  if (hash === "quote") {
    activateTab("quote");
  } else if (hash === "guide" || hash === "pricing") {
    activateTab("guide");
  }
}

function revealOnScroll() {
  document.querySelectorAll("[data-reveal-delay]").forEach((node) => {
    node.style.setProperty("--reveal-delay", `${Number(node.dataset.revealDelay || 0)}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
}

function bindGlowCards() {
  document.querySelectorAll(".glow-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--glow-x", `${x}%`);
      card.style.setProperty("--glow-y", `${y}%`);
    });
  });
}

function bindParallax() {
  const nodes = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!nodes.length || window.innerWidth < 900) {
    return;
  }

  const apply = () => {
    const viewportHeight = window.innerHeight || 1;
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const strength = Number(node.dataset.parallax || 10);
      const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
      const translate = Math.max(Math.min(centerOffset / viewportHeight, 1), -1) * strength;
      node.style.transform = `translate3d(0, ${translate}px, 0)`;
    });
  };

  apply();
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(() => {
      apply();
      ticking = false;
    });
  }, { passive: true });
}

function buildMailto(payload, estimate, tiers = []) {
  const leadName = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.company || "Project lead";
  const tierSummary = tiers.length
    ? tiers.map((tier) => `${tier.name}: ${tier.priceLabel}`).join(" | ")
    : "Not generated";
  const subject = encodeURIComponent(`Turnkey Web estimate request - ${estimate.recommendedPackage} - ${estimate.formattedRange}`);
  const body = encodeURIComponent(
`Hi Ricky,

I completed the Turnkey Web quote builder and would like to move forward.

Contact: ${leadName}
Company: ${payload.company || ""}
Email: ${payload.email || ""}
Phone: ${payload.phone || ""}
Industry: ${payload.industry || ""}
Current site: ${payload.currentSiteUrl || ""}
Project type: ${estimate.recommendedPackage}
Timeline: ${payload.timeline || ""}
Budget band: ${payload.budgetBand || ""}
Page count: ${payload.pageCountBand || ""}
Goals: ${(payload.goals || []).join(", ") || "None listed"}
Features: ${(payload.features || []).join(", ") || "None listed"}
Recommended add-ons: ${estimate.addOns.join(", ") || "None"}
Estimate range: ${estimate.formattedRange}
Tier options: ${tierSummary}
Notes: ${payload.notes || ""}

Please send me the next step to get started.
`
  );
  return `mailto:ricky@turnkeycfo.com?subject=${subject}&body=${body}`;
}

function renderSuccess(estimate, payload, result = null) {
  const tiers = buildTierOptions(estimate, payload);
  renderTierOptions(tiers);
  setText("result-package", "Choose the level that fits best.");
  setText(
    "result-range",
    payload.projectType === "website-care-plan" && estimate.monthlyRange
      ? `${formatCurrency(estimate.monthlyRange.low)} - ${formatCurrency(estimate.monthlyRange.high)}/mo`
      : estimate.formattedRange
  );
  setText(
    "result-addons",
    estimate.addOns.length
      ? `Suggested extras based on your selections: ${estimate.addOns.join(", ")}.`
      : "No major add-ons are being pushed into this quote. If you want more SEO, integrations, or campaign support, we can tighten that into the final version you choose."
  );
  setText(
    "result-rationale",
    `All three options point to the same ${estimate.recommendedPackage} direction, then add more proof, polish, and strategic depth as the investment climbs.`
  );
  setText("result-lead-id", result?.leadId ? `Reference ${result.leadId}` : "Ready when you are.");

  const link = document.getElementById("result-onboarding-link");
  if (!link) {
    return;
  }

  link.href = buildMailto(payload, estimate, tiers);
  link.textContent = "Email to lock in your quote";

  launchOfferPage({
    payload,
    estimate,
    result,
    tiers,
    mailto: link.href,
    generatedAt: new Date().toISOString()
  });
}

function initOfferPage() {
  if (!document.body.classList.contains("page-offer")) {
    return;
  }

  const data = readOfferData();
  if (!data?.payload || !data?.estimate || !Array.isArray(data?.tiers)) {
    window.location.replace("./pricing.html#quote");
    return;
  }

  const { payload, estimate, tiers, result, mailto } = data;
  renderTierOptions(tiers);

  setText("offer-heading", "Choose the level that fits best.");
  setText(
    "offer-rationale",
    `We developed these three options around your ${estimate.recommendedPackage} direction so you can choose the right level of polish, proof, and strategic depth.`
  );
  setText(
    "offer-range",
    payload.projectType === "website-care-plan" && estimate.monthlyRange
      ? `${formatCurrency(estimate.monthlyRange.low)} - ${formatCurrency(estimate.monthlyRange.high)}/mo`
      : estimate.formattedRange
  );
  setText("offer-project-type", estimate.recommendedPackage);
  setText("offer-pages", payload.pageCountBand || "2-3 pages");
  setText("offer-timeline", payload.timeline || "Next 30-60 days");
  setText("offer-confidence", String(estimate.confidence || "high").toUpperCase());
  setText(
    "offer-addons",
    estimate.addOns.length
      ? `Suggested additions based on your selections: ${estimate.addOns.join(", ")}.`
      : "No major add-ons are being pushed into this quote. If you want more SEO, integration depth, or campaign support, we can tighten that into the final version you choose."
  );
  setText("offer-reference", result?.leadId ? `Reference ${result.leadId}` : "Reply when you are ready and we will lock the right version in cleanly.");

  const mailtoLink = mailto || buildMailto(payload, estimate, tiers);
  const cta = document.getElementById("result-onboarding-link");
  const topCta = document.getElementById("offer-email-top");
  if (cta) {
    cta.href = mailtoLink;
  }
  if (topCta) {
    topCta.href = mailtoLink;
  }

  window.requestAnimationFrame(() => {
    document.body.classList.add("offer-page-ready");
  });
}

async function submitEstimate(event) {
  event.preventDefault();
  activateTab("quote");

  const payload = getPayload();
  if (!payload) {
    return;
  }

  if (!quoteForm.reportValidity()) {
    return;
  }

  estimateUnlocked = true;
  const unlocked = updateLockState();
  if (!unlocked) {
    emailInput?.focus();
    return;
  }

  const estimate = renderPreview(payload);
  const submitButton = document.getElementById("estimate-submit");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Preparing estimate...";
  }

  try {
    if (!isStaticMode) {
      const result = await postJson("/api/estimate", payload);
      if (!result.ok) {
        throw new Error(result.error || "Submission failed");
      }
      renderSuccess(estimate, payload, result);
      if (statusNode) {
        statusNode.textContent = "Opening your custom quote page now.";
      }
    } else {
      renderSuccess(estimate, payload);
      if (statusNode) {
        statusNode.textContent = "Opening your custom quote page now.";
      }
    }

  } catch (error) {
    renderSuccess(estimate, payload);
    if (statusNode) {
      statusNode.textContent = `${error.message || "Submission failed"}. Opening your custom quote page anyway.`;
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Complete estimate";
    }
  }
}

quoteForm?.addEventListener("input", () => {
  updateChoicePills();
  const payload = getPayload();
  if (payload) {
    renderPreview(payload);
  }
  if (!validEmail(emailInput?.value)) {
    estimateUnlocked = false;
    closeOfferExperience();
  }
  updateLockState();
});
quoteForm?.addEventListener("change", updateChoicePills);
quoteForm?.addEventListener("submit", submitEstimate);

offerCloseButton?.addEventListener("click", closeOfferExperience);
successPanel?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.hasAttribute("data-offer-close")) {
    closeOfferExperience();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && successPanel?.classList.contains("is-visible")) {
    closeOfferExperience();
  }
});

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tabTarget, { syncHash: true }));
});

document.querySelectorAll("[data-open-tab]").forEach((trigger) => {
  trigger.addEventListener("click", () => activateTab(trigger.dataset.openTab));
});

updateChoicePills();
updateLockState();
if (quoteForm) {
  renderPreview(getPayload());
}
initOfferPage();
activateTabFromLocation();
window.addEventListener("hashchange", activateTabFromLocation);
revealOnScroll();
bindGlowCards();
bindParallax();

const GHL_CHAT_LOCATION_ID = "REPLACE_WITH_TURNKEY_WEB_GHL_LOCATION_ID";
const GHL_CHAT_LOADER_URL = "https://widgets.leadconnectorhq.com/loader.js";
const GHL_CHAT_RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";
const GHL_CHAT_SKIP_PAGES = new Set(["admin.html", "onboarding.html", "operations.html", "social-agent.html"]);

function loadGhlChatWidget() {
  const currentPage = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";
  const locationId = String(GHL_CHAT_LOCATION_ID || "").trim();
  if (!locationId || locationId.startsWith("REPLACE_WITH_") || GHL_CHAT_SKIP_PAGES.has(currentPage)) {
    return;
  }

  if (!document.querySelector(`chat-widget[location-id="${locationId}"]`)) {
    const widget = document.createElement("chat-widget");
    widget.setAttribute("location-id", locationId);
    document.body.appendChild(widget);
  }

  if (document.querySelector(`script[src="${GHL_CHAT_LOADER_URL}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.src = GHL_CHAT_LOADER_URL;
  script.async = true;
  script.setAttribute("data-resources-url", GHL_CHAT_RESOURCES_URL);
  document.body.appendChild(script);
}

loadGhlChatWidget();
