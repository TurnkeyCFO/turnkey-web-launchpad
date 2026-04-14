import test from "node:test";
import assert from "node:assert/strict";
import { computeEstimate } from "../src/lib/pricing.js";

test("computeEstimate returns a stable range for a business site", () => {
  const estimate = computeEstimate({
    projectType: "business-website-build",
    pageCountBand: "2-3 pages",
    timeline: "Next 30-60 days",
    goals: ["Generate leads"],
    features: ["Contact forms", "Analytics and tracking"]
  });

  assert.equal(estimate.recommendedPackage, "Business Website Build");
  assert.equal(estimate.range.low >= 1000, true);
  assert.equal(estimate.range.high > estimate.range.low, true);
  assert.equal(estimate.range.high - estimate.range.low <= 500, true);
});

test("care plan returns monthly pricing metadata", () => {
  const estimate = computeEstimate({
    projectType: "website-care-plan",
    pageCountBand: "1 page",
    timeline: "Flexible / planning ahead",
    goals: [],
    features: []
  });

  assert.deepEqual(estimate.monthlyRange, { low: 100, high: 250 });
});

test("normal 3-5 page builds stay under the public estimator ceiling", () => {
  const estimate = computeEstimate({
    projectType: "business-website-build",
    pageCountBand: "4-5 pages",
    timeline: "ASAP (under 2 weeks)",
    goals: ["Generate leads", "Launch paid ads", "Refresh branding", "Improve SEO/local discovery"],
    features: ["CRM/email integration", "Local SEO pages", "E-commerce / payments"]
  });

  assert.equal(estimate.range.high <= 3500, true);
  assert.equal(estimate.range.high - estimate.range.low <= 500, true);
});
