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
const emailInput = document.getElementById("email");
const isStaticMode = window.location.hostname.includes("github.io");
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
      statusNode.textContent = "Enter a valid email, then press Complete estimate to reveal your finished estimate.";
    } else if (!estimateUnlocked) {
      statusNode.textContent = "Press Complete estimate to reveal your finished estimate.";
    } else {
      statusNode.textContent = "Your estimate is ready below.";
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

function buildMailto(payload, estimate) {
  const leadName = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.company || "Project lead";
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
Notes: ${payload.notes || ""}

Please send me the next step to get started.
`
  );
  return `mailto:ricky@turnkeycfo.com?subject=${subject}&body=${body}`;
}

function renderSuccess(estimate, payload, result = null) {
  successPanel?.classList.remove("hidden");
  setText("result-package", estimate.recommendedPackage);
  setText("result-range", estimate.formattedRange);
  setText("result-confidence", estimate.confidence.toUpperCase());
  setText("result-addons", estimate.addOns.length ? estimate.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("result-rationale", estimate.rationale.join(" - "));
  setText("result-lead-id", result?.leadId || "EMAIL CONFIRMED");

  const link = document.getElementById("result-onboarding-link");
  if (!link) {
    return;
  }

  if (result?.onboardingUrl) {
    link.href = result.onboardingUrl;
    link.textContent = "Share project details";
  } else {
    link.href = buildMailto(payload, estimate);
    link.textContent = "Email this estimate";
  }
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
        statusNode.textContent = "Your estimate is ready. Share your project details whenever you are ready to move forward.";
      }
    } else {
      const mailto = buildMailto(payload, estimate);
      renderSuccess(estimate, payload);
      if (statusNode) {
        statusNode.textContent = "Your email app should open with the estimate details ready to send.";
      }
      window.location.href = mailto;
    }

    successPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const mailto = buildMailto(payload, estimate);
    renderSuccess(estimate, payload);
    if (statusNode) {
      statusNode.textContent = `${error.message || "Submission failed"}. Falling back to a prefilled email.`;
    }
    window.location.href = mailto;
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
    successPanel?.classList.add("hidden");
  }
  updateLockState();
});
quoteForm?.addEventListener("change", updateChoicePills);
quoteForm?.addEventListener("submit", submitEstimate);

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
activateTabFromLocation();
window.addEventListener("hashchange", activateTabFromLocation);
revealOnScroll();
bindGlowCards();
bindParallax();
