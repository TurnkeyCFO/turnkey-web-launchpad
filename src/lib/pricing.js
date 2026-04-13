import { formatCurrency, textList } from "./utils.js";

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

export function computeEstimate(input) {
  const projectType = input.projectType || "business-website-build";
  const pageCountBand = input.pageCountBand || "2-5 pages";
  const selectedFeatures = textList(input.features);
  const selectedGoals = textList(input.goals);
  const timeline = input.timeline || "Next 30-60 days";

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

  const confidence = projectType === "website-care-plan" ? "high" : selectedFeatures.length > 5 ? "medium" : "high";
  const rationale = [
    `${input.projectTypeLabel || humanizeProjectType(projectType)} base range`,
    `${pageCountBand} scope band`,
    selectedFeatures.length ? `${selectedFeatures.length} feature selections` : "lean feature set"
  ];

  return {
    projectType,
    recommendedPackage: humanizeProjectType(projectType),
    range: {
      low: Math.max(0, Math.round(low / 50) * 50),
      high: Math.max(0, Math.round(high / 50) * 50)
    },
    monthlyRange: base.monthlyLow || base.monthlyHigh ? { low: base.monthlyLow, high: base.monthlyHigh } : null,
    confidence,
    rationale,
    addOns,
    formattedRange: `${formatCurrency(Math.max(0, Math.round(low / 50) * 50))} - ${formatCurrency(
      Math.max(0, Math.round(high / 50) * 50)
    )}`
  };
}

export function humanizeProjectType(value) {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
