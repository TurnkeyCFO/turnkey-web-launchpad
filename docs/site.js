/* ═══════════════════════════════════════════════════
   TURNKEY WEB — site.js
   Pricing: $1k / $1.5k / $2k spread
   Tiers: Launch / Growth / Authority (fully differentiated)
   Tier selection required before Submit
   Submit → Google Apps Script webhook (true one-click)
   ═══════════════════════════════════════════════════ */

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3WTNHSphNeqvrSBYyFilCvP2hYRV8YCCpSgLOCThC6PheZ2hflDtLUTUmgOxBCoPT/exec";

/* ── PRICING MATRIX ── */
const packageMatrix = {
  "landing-page-sprint":    { base: 700,  band: 700,  monthlyLow: 0,   monthlyHigh: 0   },
  "business-website-build": { base: 1000, band: 1000, monthlyLow: 0,   monthlyHigh: 0   },
  "website-refresh":        { base: 600,  band: 600,  monthlyLow: 0,   monthlyHigh: 0   },
  "website-care-plan":      { base: 150,  band: 350,  monthlyLow: 150, monthlyHigh: 500 }
};

const pageCountAdjustments = {
  "1 page":    0,
  "2-3 pages": 0,
  "4-5 pages": 250,
  "6-8 pages": 600,
  "9+ pages":  1000
};

const featureAdjustments = {
  "Contact forms":           0,
  "Calendar booking":        0,
  "Blog/resources":          0,
  "Portfolio/case studies":  0,
  "Testimonials":            0,
  "Quote request flow":      0,
  "CRM/email integration":   150,
  "Analytics and tracking":  0,
  "Local SEO pages":         250,
  "E-commerce / payments":   600
};

const goalAdjustments = {
  "Generate leads":             0,
  "Look more credible":         0,
  "Book appointments":          0,
  "Launch paid ads":            100,
  "Improve SEO/local discovery": 0,
  "Refresh branding":           100
};

const timelineAdjustments = {
  "ASAP (under 2 weeks)":    250,
  "This month":              100,
  "Next 30-60 days":         0,
  "Flexible / planning ahead": 0
};

/* ── TIER FEATURES (per project type, per tier level) ── */
const tierFeatures = {
  "business-website-build": {
    launch: [
      "Up to 3 pages (Home, About, Contact)",
      "Mobile-responsive design & layout",
      "Contact form setup + spam protection",
      "Google Analytics 4 installation",
      "On-page SEO: meta titles, descriptions & image alt tags",
      "First draft delivered within 7 days",
      "2 rounds of revisions included"
    ],
    growth: [
      "Everything in Launch, plus:",
      "Up to 5 pages (adds Services + Testimonials page)",
      "Testimonials & social proof section with rich layout",
      "Calendly or booking widget integration",
      "Blog template (ready for your first post)",
      "Enhanced lead capture form with thank-you redirect",
      "Google Business Profile optimization guidance",
      "5 rounds of revisions included"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Up to 8 pages (adds Location/Service SEO pages)",
      "3 local SEO service-area pages built & optimized",
      "CRM or email list integration (Mailchimp, HubSpot, etc.)",
      "Core Web Vitals performance optimization",
      "Custom case study or portfolio section",
      "One free 30-min strategy call post-launch",
      "Unlimited revisions for 30 days after launch",
      "Priority support queue & faster turnaround"
    ]
  },
  "landing-page-sprint": {
    launch: [
      "1 focused, high-converting landing page",
      "Mobile-responsive & cross-browser tested",
      "Headline, subhead, and CTA copy structure",
      "Contact or lead capture form",
      "Google Analytics 4 setup",
      "First draft within 5 days",
      "2 revision rounds"
    ],
    growth: [
      "Everything in Launch, plus:",
      "A/B headline variant for split testing",
      "Trust section: logos, reviews, or proof badges",
      "Calendly or booking embed integration",
      "Thank-you page with follow-up CTA",
      "Facebook Pixel or Google Ads tag setup",
      "4 revision rounds"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Full-scroll multi-section storytelling layout",
      "Video embed or walkthrough section",
      "Live chat or chatbot integration",
      "Heatmap tool setup (Hotjar or similar)",
      "CRM or email automation connection",
      "Unlimited revisions for 21 days",
      "30-min post-launch debrief call"
    ]
  },
  "website-refresh": {
    launch: [
      "Design refresh of up to 3 existing pages",
      "Updated typography, colors & spacing",
      "Mobile responsiveness fixes",
      "Speed & image optimization pass",
      "Updated meta titles & descriptions",
      "First draft within 7 days",
      "2 revision rounds"
    ],
    growth: [
      "Everything in Launch, plus:",
      "Refresh of up to 5 pages",
      "New testimonials section added",
      "Improved CTA placement & conversion flow",
      "Contact form rebuild or repair",
      "Calendly booking integration",
      "4 revision rounds"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Full brand alignment across all pages",
      "Up to 7 pages refreshed",
      "Core Web Vitals performance fixes",
      "Google Analytics 4 migration or audit",
      "New local SEO page added",
      "Unlimited revisions for 21 days",
      "Priority support"
    ]
  },
  "website-care-plan": {
    launch: [
      "Core updates and routine site maintenance",
      "Monthly uptime & security monitoring",
      "Up to 2 hours of edits per month",
      "Plugin & platform updates",
      "Light SEO tune-ups (meta tags, content tweaks)",
      "Email support with 48-hour response"
    ],
    growth: [
      "Everything in Essential, plus:",
      "Up to 5 hours of edits per month",
      "Monthly conversion review & improvement suggestion",
      "Google Analytics monthly report",
      "One new section or page element per month",
      "SEO content update (1 page/month)",
      "Priority email support with 24-hour response"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Up to 10 hours of edits per month",
      "Monthly 30-min strategy call",
      "Proactive UX improvement recommendations",
      "2 SEO content updates per month",
      "New blog post drafting assistance",
      "Highest priority support (same-day response)",
      "Quarterly full site audit"
    ]
  }
};

/* ── STATE ── */
let estimateUnlocked = false;
let selectedTierName = null;
let selectedTierPrice = null;

/* ── DOM REFS ── */
const quoteForm       = document.getElementById("estimate-form");
const statusNode      = document.getElementById("estimate-form-status");
const estimateCard    = document.getElementById("estimate-result");
const successPanel    = document.getElementById("estimate-success-panel");
const offerDialog     = successPanel?.querySelector(".offer-letter-shell");
const offerCloseBtn   = document.getElementById("offer-close");
const emailInput      = document.getElementById("email");
const isStaticMode    = window.location.hostname.includes("github.io");
const OFFER_STORAGE   = "turnkey-web-offer-data";
const resultSubmitBtn = document.getElementById("result-submit-btn");
const tierRequiredNote= document.getElementById("result-lead-id");

/* ── UTILITIES ── */
function formatCurrency(v){
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(v||0));
}
function roundTo50(v){ return Math.max(0, Math.round(Number(v||0)/50)*50); }
function setText(id,v){ const n=document.getElementById(id); if(n) n.textContent=v; }
function escapeHtml(v){
  return String(v??"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function collectMultiSelect(name){
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i=>i.value);
}
function humanizeProjectType(v){
  return String(v||"").split("-").map(p=>`${p[0].toUpperCase()}${p.slice(1)}`).join(" ");
}
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim()); }

/* ── GET FORM PAYLOAD ── */
function getPayload(){
  if(!quoteForm) return null;
  const fd = new FormData(quoteForm);
  const p  = Object.fromEntries(fd.entries());
  p.goals    = collectMultiSelect("goals");
  p.features = collectMultiSelect("features");
  return p;
}

/* ── COMPUTE ESTIMATE ── */
function computeEstimate(payload){
  const pt  = payload.projectType    || "business-website-build";
  const pcb = payload.pageCountBand  || "2-3 pages";
  const sel = payload.features       || [];
  const gls = payload.goals          || [];
  const tl  = payload.timeline       || "Next 30-60 days";

  const base   = packageMatrix[pt] || packageMatrix["business-website-build"];
  const pageAdj= pageCountAdjustments[pcb] || 0;
  const tlAdj  = timelineAdjustments[tl]   || 0;

  let price = base.base + pageAdj + tlAdj;
  sel.forEach(f => { price += featureAdjustments[f] || 0; });
  gls.forEach(g => { price += goalAdjustments[g]    || 0; });

  const pricedAddOns = sel.filter(f => featureAdjustments[f] > 0);
  const complexitySignals = [
    pricedAddOns.length > 0,
    gls.includes("Launch paid ads"),
    gls.includes("Refresh branding"),
    pcb === "6-8 pages",
    pcb === "9+ pages"
  ].filter(Boolean).length;

  let band = base.band || 1000;
  if(pt === "website-care-plan") band = 350;
  else if(sel.includes("E-commerce / payments") || pcb === "9+ pages") band = 1200;
  else if(complexitySignals >= 2) band = 1000;

  const low  = roundTo50(price);
  const high = roundTo50(price + band);

  const addOns = [];
  if(gls.includes("Improve SEO/local discovery")){
    addOns.push("SEO foundations included");
    if(!sel.includes("Local SEO pages") && pt !== "website-care-plan") addOns.push("Local SEO page set recommended");
  }
  if(sel.includes("CRM/email integration")) addOns.push("CRM integration");
  if(sel.includes("Local SEO pages"))       addOns.push("Local SEO page set");
  if(sel.includes("E-commerce / payments")) addOns.push("Payments setup");
  if(gls.includes("Launch paid ads"))       addOns.push("Campaign landing page support");
  if(gls.includes("Refresh branding"))      addOns.push("Brand polish");
  if(tl === "ASAP (under 2 weeks)")         addOns.push("Rush delivery");

  const confidence = pt === "website-care-plan" || band <= 400 ? "high" : "medium";

  return {
    range: { low, high },
    recommendedPackage: humanizeProjectType(pt),
    formattedRange: `${formatCurrency(low)} – ${formatCurrency(high)}`,
    confidence,
    addOns,
    rationale: [
      `${humanizeProjectType(pt)} starting point`,
      pcb === "2-3 pages" ? "up to 3 pages included" : pcb,
      pricedAddOns.length ? `${pricedAddOns.length} priced add-on${pricedAddOns.length===1?"":"s"}` : "standard features included"
    ],
    monthlyRange: (base.monthlyLow || base.monthlyHigh) ? { low: base.monthlyLow, high: base.monthlyHigh } : null
  };
}

/* ── BUILD TIER OPTIONS ── */
function buildTierOptions(estimate, payload){
  const pt   = payload.projectType || "business-website-build";
  const ptKey = pt.replace(/-/g,"").replace("websitecareplan","websitecarep");
  const isCarePlan = pt === "website-care-plan";

  const low  = isCarePlan ? (estimate.monthlyRange?.low  || estimate.range.low)  : estimate.range.low;
  const high = isCarePlan ? (estimate.monthlyRange?.high || estimate.range.high) : estimate.range.high;
  const mid  = roundTo50((low + high) / 2);

  const suffix = isCarePlan ? "/mo" : "";
  const features = tierFeatures[pt] || tierFeatures["business-website-build"];

  /* Personalized value statement based on goals */
  const needsSEO     = payload.goals.includes("Improve SEO/local discovery") || payload.features.includes("Local SEO pages");
  const needsAds     = payload.goals.includes("Launch paid ads");
  const needsBooking = payload.goals.includes("Book appointments") || payload.features.includes("Calendar booking");
  const needsCRM     = payload.features.includes("CRM/email integration");

  function valueLine(tier){
    if(tier === "launch"){
      if(needsBooking) return "Get live fast with a clean booking path — start capturing appointments right away.";
      if(needsAds)     return "A solid page ready to run ads to — clean structure, clear CTA, fast load time.";
      return "Get a professional web presence live fast — the cleanest, most focused version of your project.";
    }
    if(tier === "growth"){
      if(needsSEO)     return "The strongest balance of trust, proof, and SEO structure — built to rank and convert.";
      if(needsBooking) return "More trust signals + a booking system that works — the level most clients see the clearest ROI on.";
      if(needsCRM)     return "Integrated with your CRM so every lead is captured, tracked, and followed up automatically.";
      return "More proof, stronger conversion flow, and the depth most small businesses actually need to look established.";
    }
    /* authority */
    if(needsSEO)  return "Maximum SEO depth — service-area pages, structured content, and authority signals that compound over time.";
    if(needsAds)  return "Built for scale: ad-ready landing support, full analytics, and CRM integration from day one.";
    return "The most complete version — designed for businesses where trust, depth, and first-impression quality matter most.";
  }

  const tierNames    = isCarePlan ? ["Essential Care", "Growth Care", "Priority Care"] : ["Launch", "Growth", "Authority"];
  const tierBadges   = ["Leanest path", "Most balanced", "Most complete"];
  const tierFitLines = [
    isCarePlan ? "Best for businesses that mainly need upkeep and light support."
               : "Best for getting live quickly with a clean, professional presence.",
    isCarePlan ? "Best balance of ongoing improvements and steady support."
               : "Best for most small businesses that want stronger trust + conversion.",
    isCarePlan ? "Best for businesses that want a proactive, hands-on website partner."
               : "Best for businesses where authority, depth, or complexity matter most."
  ];
  const tierPrices = [
    `${formatCurrency(low)}${suffix}`,
    `${formatCurrency(mid)}${suffix}`,
    `${formatCurrency(high)}${suffix}`
  ];
  const tierSummaries = [
    isCarePlan
      ? "Reliable monthly upkeep with updates, maintenance, and light SEO support."
      : "A clean, credible launch with the core essentials handled professionally.",
    isCarePlan
      ? "The strongest balance of ongoing support, improvements, and growth-focused upkeep."
      : "The strongest balance of polish, proof, and conversion depth for most businesses.",
    isCarePlan
      ? "The most hands-on option — proactive support, strategy calls, and faster response."
      : "The most developed version — more depth, more refinement, and more strategic reach."
  ];
  const tierKeys = ["launch","growth","authority"];

  return tierNames.map((name, i) => ({
    badge:    tierBadges[i],
    name,
    priceLabel: tierPrices[i],
    fit:      tierFitLines[i],
    summary:  tierSummaries[i],
    valueLine: valueLine(tierKeys[i]),
    points:   features[tierKeys[i]] || []
  }));
}

/* ── RENDER TIER CARDS ── */
function renderTierOptions(tiers){
  const container = document.getElementById("offer-tier-grid");
  if(!container) return;

  container.innerHTML = tiers.map((tier, index) => `
    <article class="offer-tier${index===1?" offer-tier-featured":""}">
      ${index===1 ? '<div class="tier-highlight">⭐ Recommended</div>' : ""}
      <div class="tier-topline">
        <span class="tier-step">Option ${String(index+1).padStart(2,"0")}</span>
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
      <div class="tier-fit">${escapeHtml(tier.valueLine)}</div>
      <ul>
        ${tier.points.map(pt=>`<li>${escapeHtml(pt)}</li>`).join("")}
      </ul>
      <button
        class="tier-select-btn"
        type="button"
        data-tier-index="${index}"
        data-tier-name="${escapeHtml(tier.name)}"
        data-tier-price="${escapeHtml(tier.priceLabel)}"
        onclick="selectTier(this)"
      >Select ${escapeHtml(tier.name)}</button>
    </article>
  `).join("");
}

/* ── INDUSTRY DROPDOWN ── */
window.handleIndustryChange = function(select){
  const otherGroup = document.getElementById("other-industry-group");
  if(!otherGroup) return;
  if(select.value === "Other"){
    otherGroup.style.display = "";
    document.getElementById("otherIndustry")?.focus();
  } else {
    otherGroup.style.display = "none";
    const otherInput = document.getElementById("otherIndustry");
    if(otherInput) otherInput.value = "";
  }
};

/* ── TIER SELECTION ── */
window.selectTier = function(btn){
  document.querySelectorAll(".tier-select-btn").forEach(b => {
    b.classList.remove("selected");
    b.textContent = `Select ${b.dataset.tierName}`;
  });
  btn.classList.add("selected");
  selectedTierName  = btn.dataset.tierName;
  selectedTierPrice = btn.dataset.tierPrice;
  btn.textContent = `✓ ${selectedTierName} Selected`;

  /* Enable the submit button now that a tier is chosen */
  if(resultSubmitBtn){
    resultSubmitBtn.disabled = false;
    resultSubmitBtn.style.opacity = "1";
    resultSubmitBtn.style.cursor  = "pointer";
  }
  if(tierRequiredNote){
    tierRequiredNote.textContent = `${selectedTierName} selected — press Submit to send your quote.`;
  }
};

/* ── PERSIST / READ OFFER DATA ── */
function persistOfferData(data){
  try{ window.localStorage.setItem(OFFER_STORAGE, JSON.stringify(data)); }
  catch(e){ console.warn("Unable to persist offer data", e); }
}
function readOfferData(){
  try{ const r=window.localStorage.getItem(OFFER_STORAGE); return r?JSON.parse(r):null; }
  catch(e){ return null; }
}

/* ── OPEN / CLOSE OFFER SHEET ── */
function openOfferExperience(){
  if(!successPanel) return;
  successPanel.classList.remove("hidden");
  successPanel.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>{
    successPanel.classList.add("is-visible");
    offerDialog?.focus();
    /* Animate the shell in */
    setTimeout(()=>{
      offerDialog?.classList.add("shell-visible");
    }, 60);
    /* Stagger tier cards in */
    setTimeout(()=>{
      document.querySelectorAll(".offer-tier").forEach(card=>{
        card.classList.add("tier-visible");
      });
    }, 200);
  });
}
function closeOfferExperience(){
  if(!successPanel) return;
  successPanel.classList.remove("is-visible");
  successPanel.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  offerDialog?.classList.remove("shell-visible");
  setTimeout(()=>{
    if(!successPanel.classList.contains("is-visible")){
      successPanel.classList.add("hidden");
      /* Reset tier card animations for next open */
      document.querySelectorAll(".offer-tier").forEach(c=>c.classList.remove("tier-visible"));
    }
  }, 420);
}

/* ── BUILD SUBMISSION PAYLOAD ── */
function buildSubmissionPayload(payload, estimate, tiers=[], selectedTier=null){
  const name = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.company || "Project lead";
  const tierSummary = tiers.length
    ? tiers.map(t=>`${t.name}: ${t.priceLabel}`).join(" | ")
    : "Not generated";
  return {
    source:        "Turnkey Web Quote Builder",
    submittedAt:   new Date().toISOString(),
    name,
    company:       payload.company    || "",
    email:         payload.email      || "",
    phone:         payload.phone      || "",
    industry:      (payload.industry === "Other" ? (payload.otherIndustry || "").trim() || "Other" : payload.industry) || "",
    existingWebsite: payload.existingWebsite || "",
    projectType:   estimate.recommendedPackage,
    timeline:      payload.timeline   || "",
    budgetBand:    payload.budgetBand || "",
    pageCount:     payload.pageCountBand || "",
    goals:         (payload.goals    ||[]).join(", "),
    features:      (payload.features ||[]).join(", "),
    notes:         payload.notes      || "",
    estimateRange: estimate.formattedRange,
    tierOptions:   tierSummary,
    selectedTier:  selectedTier ? `${selectedTier.name} (${selectedTier.price})` : "Not selected",
    addOns:        estimate.addOns.join(", ") || "None"
  };
}

/* ── SUBMIT TO WEBHOOK ── */
async function submitToWebhook(data){
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    mode:   "no-cors",   /* GAS webhook requires no-cors */
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  /* no-cors responses are opaque — treat any non-throw as success */
  return true;
}

/* ── RENDER PREVIEW CARD ── */
function renderPreview(payload){
  const est = computeEstimate(payload);
  setText("preview-package",       est.recommendedPackage);
  setText("preview-range",         est.formattedRange);
  setText("preview-confidence",    est.confidence.toUpperCase());
  setText("preview-pages",         payload.pageCountBand || "2-3 pages");
  setText("preview-timeline",      payload.timeline      || "Next 30-60 days");
  setText("preview-goals-count",   String(payload.goals.length));
  setText("preview-features-count",String(payload.features.length));
  setText("preview-addons",        est.addOns.length ? est.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("preview-rationale",     est.rationale.join(" – "));
  setText("preview-monthly",
    est.monthlyRange
      ? `Monthly guidance ${formatCurrency(est.monthlyRange.low)} – ${formatCurrency(est.monthlyRange.high)}`
      : "One-time project range"
  );
  return est;
}

/* ── UPDATE LOCK STATE ── */
function updateLockState(){
  const hasEmail = validEmail(emailInput?.value);
  const unlocked = estimateUnlocked && hasEmail;
  estimateCard?.classList.toggle("locked",!unlocked);
  if(statusNode){
    if(!hasEmail) statusNode.textContent = "Enter your email last and press Get my quote to reveal your three options.";
    else if(!estimateUnlocked) statusNode.textContent = "Press Get my quote to open your custom quote.";
    else statusNode.textContent = "Your Quote Builder results are ready — choose your tier and press Submit.";
  }
  return unlocked;
}
function updateChoicePills(){
  document.querySelectorAll(".choice-pill").forEach(pill=>{
    pill.classList.toggle("is-selected", Boolean(pill.querySelector("input")?.checked));
  });
}

/* ── RENDER SUCCESS / OFFER PAGE ── */
function renderSuccess(estimate, payload){
  const tiers = buildTierOptions(estimate, payload);

  /* Reset tier selection state */
  selectedTierName  = null;
  selectedTierPrice = null;
  if(resultSubmitBtn){
    resultSubmitBtn.disabled = true;
    resultSubmitBtn.style.opacity = "0.4";
    resultSubmitBtn.style.cursor  = "not-allowed";
    resultSubmitBtn.textContent   = "Submit";
  }
  if(tierRequiredNote) tierRequiredNote.textContent = "Select a tier above to submit your quote.";

  renderTierOptions(tiers);

  setText("result-package", `Here's your custom quote, ${payload.firstName || "friend"}.`);
  setText("result-range",
    payload.projectType === "website-care-plan" && estimate.monthlyRange
      ? `${formatCurrency(estimate.monthlyRange.low)} – ${formatCurrency(estimate.monthlyRange.high)}/mo`
      : estimate.formattedRange
  );
  setText("result-addons",
    estimate.addOns.length
      ? `Suggested extras based on your inputs: ${estimate.addOns.join(", ")}.`
      : "No major add-ons are being pushed. If you want more SEO depth, integrations, or campaign support, we can scope that into the version you choose."
  );
  setText("result-rationale",
    `Based on your ${estimate.recommendedPackage} scope — pick the level of polish and depth that fits your goals and timeline. Select a tier below, then press Submit.`
  );

  /* Wire submit button */
  if(resultSubmitBtn){
    resultSubmitBtn.onclick = async () => {
      if(!selectedTierName){ return; }
      const btn = resultSubmitBtn;
      btn.disabled = true;
      btn.textContent = "Sending…";

      const submissionData = buildSubmissionPayload(payload, estimate, tiers, {
        name:  selectedTierName,
        price: selectedTierPrice
      });

      try{
        await submitToWebhook(submissionData);
        btn.textContent = "✓ Quote sent!";
        btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
        if(tierRequiredNote) tierRequiredNote.textContent = "Your quote has been submitted — the Turnkey team will be in touch shortly.";
      } catch(err){
        console.error("Webhook error:", err);
        btn.textContent = "Submit";
        btn.disabled = false;
        btn.style.opacity = "1";
        if(tierRequiredNote) tierRequiredNote.textContent = "Something went wrong — please try again.";
      }
    };
  }

  persistOfferData({ payload, estimate, tiers, generatedAt: new Date().toISOString() });
  openOfferExperience();
}

/* ── SUBMIT HANDLER ── */
async function submitEstimate(e){
  e.preventDefault();
  const payload = getPayload();
  if(!payload || !quoteForm.reportValidity()) return;

  estimateUnlocked = true;
  const unlocked = updateLockState();
  if(!unlocked){ emailInput?.focus(); return; }

  const estimate = renderPreview(payload);
  const btn = document.getElementById("estimate-submit");
  if(btn){ btn.disabled=true; btn.textContent="Building your quote…"; }

  try{
    renderSuccess(estimate, payload);
    if(statusNode) statusNode.textContent = "Opening your custom quote now.";
  } catch(err){
    renderSuccess(estimate, payload);
  } finally{
    if(btn){ btn.disabled=false; btn.textContent="Get my quote →"; }
  }
}

/* ── EVENT LISTENERS ── */
quoteForm?.addEventListener("input", ()=>{
  updateChoicePills();
  const p = getPayload();
  if(p) renderPreview(p);
  if(!validEmail(emailInput?.value)){ estimateUnlocked=false; }
  updateLockState();
});
quoteForm?.addEventListener("change", updateChoicePills);
quoteForm?.addEventListener("submit", submitEstimate);

offerCloseBtn?.addEventListener("click", closeOfferExperience);
successPanel?.addEventListener("click", e=>{
  if(e.target?.hasAttribute("data-offer-close")) closeOfferExperience();
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && successPanel?.classList.contains("is-visible")) closeOfferExperience();
});

/* ── SCROLL REVEAL ── */
function revealOnScroll(){
  const nodes = document.querySelectorAll("[data-reveal]");
  nodes.forEach(n=>{
    const delay = Number(n.dataset.revealDelay||0);
    n.style.se