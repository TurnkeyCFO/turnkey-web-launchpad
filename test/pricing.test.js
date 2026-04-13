import test from "node:test";
import assert from "node:assert/strict";
import { computeEstimate } from "../src/lib/pricing.js";

test("computeEstimate returns a stable range for a business site", () => {
  const estimate = computeEstimate({
    projectType: "business-website-build",
    pageCountBand: "2-5 pages",
    timeline: "Next 30-60 days",
    goals: ["Generate leads"],
    features: ["Contact forms", "Analytics and tracking"]
  });

  assert.equal(estimate.recommendedPackage, "Business Website Build");
  assert.equal(estimate.range.low >= 3500, true);
  assert.equal(estimate.range.high > estimate.range.low, true);
});

test("care plan returns monthly pricing metadata", () => {
  const estimate = computeEstimate({
    projectType: "website-care-plan",
    pageCountBand: "1 page",
    timeline: "Flexible / planning ahead",
    goals: [],
    features: []
  });

  assert.deepEqual(estimate.monthlyRange, { low: 250, high: 900 });
});
