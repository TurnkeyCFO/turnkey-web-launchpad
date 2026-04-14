import { formatCurrency, textList } from "./utils.js";

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

function roundTo50(value) {
  return Math.max(0, Math.round(Number(value || 0) / 50) * 50);
}

function buildRange(startPrice, band) {
  const low = roundTo50(startPrice);
  const high = roundTo50(startPrice + band);
  return { low, high };
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

function getBand(projectType, pageCountBand, selectedFeatures, selectedGoals) {
  const baseBand = packageMatrix[projectType]?.band || 400;
  const selectedAddOns = selectedFeatures.filter((feature) => featureAdjustments[feature] > 0);
  const complexitySignals = [
    selectedAddOns.length > 0,
    selectedGoals.includes("Launch paid ads"),
    selectedGoals.includes("Refresh branding"),
    pageCountBand === "6-8 pages",
    pageCountBand === "9+ pages"
  ].filter(Boolean).length;

  if (projectType === "website-care-plan") {
    return 150;
  }

  if (selectedFeatures.includes("E-commerce / payments") || pageCountBand === "9+ pages") {
    return 500;
  }

  if (complexitySignals >= 2) {
    return 450;
  }

  return baseBand;
}

function buildAddOns(projectType, selectedFeatures, selectedGoals, timeline) {
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

  return addOns;
}

export function computeEstimate(input) {
  const projectType = input.projectType || "business-website-build";
  const pageCountBand = input.pageCountBand || "2-3 pages";
  const selectedFeatures = textList(input.features);
  const selectedGoals = textList(input.goals);
  const timeline = input.timeline || "Next 30-60 days";

  const base = packageMatrix[projectType] || packageMatrix["business-website-build"];
  const pageAdjustment = pageCountAdjustments[pageCountBand] || 0;
  const timelineAdjustment = timelineAdjustments[timeline] || 0;

  let price = base.base + pageAdjustment + timelineAdjustment;

  for (const feature of selectedFeatures) {
    price += featureAdjustments[feature] || 0;
  }

  for (const goal of selectedGoals) {
    price += goalAdjustments[goal] || 0;
  }

  const band = getBand(projectType, pageCountBand, selectedFeatures, selectedGoals);
  const range = applyPublicCeiling(buildRange(price, band), projectType, pageCountBand);
  const addOns = buildAddOns(projectType, selectedFeatures, selectedGoals, timeline);

  const rationale = [
    `${input.projectTypeLabel || humanizeProjectType(projectType)} starting point`,
    pageCountBand === "2-3 pages" ? "up to 3 pages included" : pageCountBand,
    selectedFeatures.filter((feature) => featureAdjustments[feature] > 0).length
      ? `${selectedFeatures.filter((feature) => featureAdjustments[feature] > 0).length} priced add-on${selectedFeatures.filter((feature) => featureAdjustments[feature] > 0).length === 1 ? "" : "s"}`
      : "standard features included"
  ];

  return {
    projectType,
    recommendedPackage: humanizeProjectType(projectType),
    range,
    monthlyRange: base.monthlyLow || base.monthlyHigh ? { low: base.monthlyLow, high: base.monthlyHigh } : null,
    confidence: projectType === "website-care-plan" || band <= 450 ? "high" : "medium",
    rationale,
    addOns,
    formattedRange: `${formatCurrency(range.low)} - ${formatCurrency(range.high)}`
  };
}

export function humanizeProjectType(value) {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
