import test from "node:test";
import assert from "node:assert/strict";
import { buildGeneratedSiteFiles } from "../src/lib/website-renderer.js";

test("buildGeneratedSiteFiles outputs docs assets", () => {
  const files = buildGeneratedSiteFiles({
    lead: { company: "Acme Plumbing", firstName: "Ava", lastName: "Jones" },
    estimate: { recommendedPackage: "Business Website Build", range: { low: 3500, high: 6000 } },
    brief: {
      heroHeadline: "Trusted plumbing help, fast.",
      heroSubheadline: "Make it easier for homeowners to reach out.",
      primaryCta: "Book a quote",
      secondaryCta: "See how it works",
      services: [{ title: "Emergency service", body: "Get help quickly when issues cannot wait." }],
      process: [{ title: "Request service", body: "Tell us what you need and where you are located." }],
      faqs: [{ question: "Do you handle emergencies?", answer: "Yes." }],
      proofPoints: ["Licensed and insured"],
      offerSummary: "Service-first website draft."
    },
    polish: {
      headlineEdits: {
        heroHeadline: "Trusted plumbing help, fast.",
        heroSubheadline: "Make it easier for homeowners to reach out."
      },
      ctaEdits: {
        primaryCta: "Book a quote",
        secondaryCta: "See how it works"
      }
    }
  });

  assert.equal(files.some((file) => file.path === "docs/index.html"), true);
  assert.equal(files.some((file) => file.path === "docs/styles.css"), true);
  assert.match(files.find((file) => file.path === "docs/index.html").content, /Acme Plumbing/);
});
