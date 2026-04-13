const packageMatrix = {
  "landing-page-sprint": { low: 1200, high: 2400, monthlyLow: 0, monthlyHigh: 0 },
  "business-website-build": { low: 3500, high: 8500, monthlyLow: 0, monthlyHigh: 0 },
  "website-refresh": { low: 1800, high: 4500, monthlyLow: 0, monthlyHigh: 0 },
  "website-care-plan": { low: 250, high: 900, monthlyLow: 250, monthlyHigh: 900 }
};

const pageCountAdjustments = {
  "1 page": { low: 0, high: 0 },
  "2-5 pages": { low: 500, high: 1400 },
  "6-10 pages": { low: 1400, high: 3200 },
  "11+ pages": { low: 2600, high: 5200 }
};

const featureAdjustments = {
  "Contact forms": { low: 0, high: 150 },
  "Calendar booking": { low: 150, high: 400 },
  "Blog/resources": { low: 300, high: 900 },
  "Portfolio/case studies": { low: 250, high: 700 },
  "Testimonials": { low: 0, high: 150 },
  "Quote request flow": { low: 250, high: 800 },
  "CRM/email integration": { low: 250, high: 900 },
  "Analytics and tracking": { low: 150, high: 450 },
  "Local SEO pages": { low: 400, high: 1200 },
  "E-commerce / payments": { low: 900, high: 3200 }
};

const timelineAdjustments = {
  "ASAP (under 2 weeks)": { low: 350, high: 1000 },
  "This month": { low: 150, high: 450 },
  "Next 30-60 days": { low: 0, high: 0 },
  "Flexible / planning ahead": { low: -150, high: 0 }
};

function collectMultiSelect(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function humanizeProjectType(value) {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getPayload() {
  const form = document.getElementById("estimate-form");
  const formData = new FormData(form);
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

  for (const feature of selectedFeatures) {
    const adjustment = featureAdjustments[feature];
    if (adjustment) {
      low += adjustment.low;
      high += adjustment.high;
    }
  }

  const addOns = [];
  if (selectedGoals.includes("Improve SEO/local discovery")) {
    addOns.push("SEO Foundations");
    low += 450;
    high += 1400;
  }

  if (selectedGoals.includes("Launch paid ads")) {
    addOns.push("Ads Landing Page Pack");
    low += 350;
    high += 950;
  }

  if (selectedGoals.includes("Refresh branding")) {
    addOns.push("Brand polish");
    low += 250;
    high += 1200;
  }

  const roundedLow = Math.max(0, Math.round(low / 50) * 50);
  const roundedHigh = Math.max(0, Math.round(high / 50) * 50);

  return {
    recommendedPackage: humanizeProjectType(projectType),
    formattedRange: `${formatCurrency(roundedLow)} - ${formatCurrency(roundedHigh)}`,
    confidence: projectType === "website-care-plan" ? "high" : selectedFeatures.length > 5 ? "medium" : "high",
    addOns,
    rationale: [
      `${humanizeProjectType(projectType)} base range`,
      `${pageCountBand} scope band`,
      selectedFeatures.length ? `${selectedFeatures.length} feature selections` : "lean feature set"
    ],
    monthlyRange: base.monthlyLow || base.monthlyHigh ? { low: base.monthlyLow, high: base.monthlyHigh } : null
  };
}

function updatePreview() {
  const payload = getPayload();
  const estimate = computeEstimate(payload);

  setText("preview-package", estimate.recommendedPackage);
  setText("preview-range", estimate.formattedRange);
  setText("preview-confidence", estimate.confidence.toUpperCase());
  setText("preview-timeline", payload.timeline || "Next 30-60 days");
  setText("preview-pages", payload.pageCountBand || "2-5 pages");
  setText("preview-goals-count", String(payload.goals.length));
  setText("preview-features-count", String(payload.features.length));
  setText("preview-addons", estimate.addOns.length ? estimate.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("preview-rationale", estimate.rationale.join(" - "));
  setText(
    "preview-monthly",
    estimate.monthlyRange
      ? `Monthly guidance ${formatCurrency(estimate.monthlyRange.low)}-${formatCurrency(estimate.monthlyRange.high)}`
      : "One-time project range"
  );

  return estimate;
}

const form = document.getElementById("estimate-form");
const status = document.getElementById("estimate-form-status");

form?.addEventListener("input", updatePreview);
form?.addEventListener("change", updatePreview);

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = getPayload();
  const estimate = updatePreview();
  const leadName = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.company || "Project lead";
  const subject = encodeURIComponent(`Turnkey Web estimate request - ${estimate.recommendedPackage} - ${estimate.formattedRange}`);
  const body = encodeURIComponent(
`Hi Ricky,

I just completed the Turnkey Web estimate form and would like to move forward.

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

  const mailto = `mailto:ricky@turnkeycfo.com?subject=${subject}&body=${body}`;

  document.getElementById("estimate-success-panel")?.classList.remove("hidden");
  setText("result-package", estimate.recommendedPackage);
  setText("result-range", estimate.formattedRange);
  setText("result-confidence", estimate.confidence.toUpperCase());
  setText("result-addons", estimate.addOns.length ? estimate.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("result-rationale", estimate.rationale.join(" - "));
  setText("result-lead-id", "EMAIL REQUEST");

  const link = document.getElementById("result-onboarding-link");
  if (link) {
    link.href = mailto;
    link.textContent = "Email this estimate";
  }

  if (status) {
    status.textContent = "Your email app should open with the estimate details prefilled.";
  }

  window.location.href = mailto;
});

updatePreview();
