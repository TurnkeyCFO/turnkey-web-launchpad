const packageMatrix = {
  "landing-page-sprint": { low: 1500, high: 2500, monthlyLow: 0, monthlyHigh: 0 },
  "business-website-build": { low: 3500, high: 6500, monthlyLow: 0, monthlyHigh: 0 },
  "website-refresh": { low: 2000, high: 4500, monthlyLow: 0, monthlyHigh: 0 },
  "website-care-plan": { low: 250, high: 900, monthlyLow: 250, monthlyHigh: 900 }
};

const pageCountAdjustments = {
  "1 page": { low: 0, high: 0 },
  "2-5 pages": { low: 500, high: 1200 },
  "6-10 pages": { low: 1400, high: 2800 },
  "11+ pages": { low: 2600, high: 5000 }
};

const featureAdjustments = {
  "Contact forms": { low: 0, high: 150 },
  "Calendar booking": { low: 150, high: 500 },
  "Blog/resources": { low: 350, high: 900 },
  "Portfolio/case studies": { low: 300, high: 850 },
  "Testimonials": { low: 0, high: 150 },
  "Quote request flow": { low: 300, high: 900 },
  "CRM/email integration": { low: 250, high: 950 },
  "Analytics and tracking": { low: 150, high: 400 },
  "Local SEO pages": { low: 450, high: 1300 },
  "E-commerce / payments": { low: 1000, high: 3400 }
};

const timelineAdjustments = {
  "ASAP (under 2 weeks)": { low: 400, high: 1200 },
  "This month": { low: 200, high: 550 },
  "Next 30-60 days": { low: 0, high: 0 },
  "Flexible / planning ahead": { low: -150, high: 0 }
};

const quoteForm = document.getElementById("estimate-form");
const statusNode = document.getElementById("estimate-form-status");
const estimateCard = document.getElementById("estimate-result");
const successPanel = document.getElementById("estimate-success-panel");
const emailInput = document.getElementById("email");
const isStaticMode = window.location.hostname.includes("github.io");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
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
  const pageCountBand = payload.pageCountBand || "2-5 pages";
  const selectedFeatures = payload.features || [];
  const selectedGoals = payload.goals || [];
  const timeline = payload.timeline || "Next 30-60 days";

  const base = packageMatrix[projectType] || packageMatrix["business-website-build"];
  const pageDelta = pageCountAdjustments[pageCountBand] || { low: 0, high: 0 };
  const timelineDelta = timelineAdjustments[timeline] || { low: 0, high: 0 };

  let low = base.low + pageDelta.low + timelineDelta.low;
  let high = base.high + pageDelta.high + timelineDelta.high;

  selectedFeatures.forEach((feature) => {
    const adjustment = featureAdjustments[feature];
    if (adjustment) {
      low += adjustment.low;
      high += adjustment.high;
    }
  });

  const addOns = [];
  if (selectedGoals.includes("Improve SEO/local discovery")) {
    addOns.push("SEO foundations");
    low += 450;
    high += 1350;
  }
  if (selectedGoals.includes("Launch paid ads")) {
    addOns.push("Campaign landing page support");
    low += 400;
    high += 950;
  }
  if (selectedGoals.includes("Refresh branding")) {
    addOns.push("Brand polish");
    low += 300;
    high += 1200;
  }

  const roundedLow = Math.max(0, Math.round(low / 50) * 50);
  const roundedHigh = Math.max(0, Math.round(high / 50) * 50);
  const confidence = projectType === "website-care-plan" ? "high" : selectedFeatures.length > 5 ? "medium" : "high";

  return {
    recommendedPackage: humanizeProjectType(projectType),
    formattedRange: `${formatCurrency(roundedLow)} - ${formatCurrency(roundedHigh)}`,
    confidence,
    addOns,
    rationale: [
      `${humanizeProjectType(projectType)} base range`,
      `${pageCountBand} scope band`,
      selectedFeatures.length ? `${selectedFeatures.length} feature selections` : "lean feature set"
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
  const unlocked = validEmail(emailInput?.value);
  estimateCard?.classList.toggle("locked", !unlocked);
  if (statusNode) {
    statusNode.textContent = unlocked
      ? "Final range unlocked. Complete estimate to continue."
      : "The final range unlocks after a valid email is entered.";
  }
  return unlocked;
}

function renderPreview(payload) {
  const estimate = computeEstimate(payload);
  setText("preview-package", estimate.recommendedPackage);
  setText("preview-range", estimate.formattedRange);
  setText("preview-confidence", estimate.confidence.toUpperCase());
  setText("preview-pages", payload.pageCountBand || "2-5 pages");
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

function activateTab(name) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.tabTarget === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${name}`);
  });
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

Please send the next step for onboarding.
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
  setText("result-lead-id", result?.leadId || "EMAIL REQUEST");

  const link = document.getElementById("result-onboarding-link");
  if (!link) {
    return;
  }

  if (result?.onboardingUrl) {
    link.href = result.onboardingUrl;
    link.textContent = "Continue to onboarding";
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
        statusNode.textContent = "Estimate ready. Continue into onboarding when you are ready.";
      }
    } else {
      const mailto = buildMailto(payload, estimate);
      renderSuccess(estimate, payload);
      if (statusNode) {
        statusNode.textContent = "Your email app should open with the estimate details prefilled.";
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
  updateLockState();
});
quoteForm?.addEventListener("change", updateChoicePills);
quoteForm?.addEventListener("submit", submitEstimate);

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
});

document.querySelectorAll("[data-open-tab]").forEach((trigger) => {
  trigger.addEventListener("click", () => activateTab(trigger.dataset.openTab));
});

updateChoicePills();
updateLockState();
if (quoteForm) {
  renderPreview(getPayload());
}
revealOnScroll();
bindGlowCards();
bindParallax();


