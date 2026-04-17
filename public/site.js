/* âââââââââââââââââââââââââââââââââââââââââââââââââââ
   TURNKEY WEB â site.js  (v6)
   Pricing: $1k / $1.5k / $2k spread
   Tiers: Launch / Growth / Authority (fully differentiated)
   Tier selection required before Submit
   Submit â Google Apps Script webhook (true one-click)
   v6: Lead capture â TK Web sheet on "Get My Quote"
       Tier update  â TK Web sheet on "Submit"
   âââââââââââââââââââââââââââââââââââââââââââââââââââ */

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3WTNHSphNeqvrSBYyFilCvP2hYRV8YCCpSgLOCThC6PheZ2hflDtLUTUmgOxBCoPT/exec";

/* ââ PRICING MATRIX ââ */
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

/* ââ TIER FEATURES (per project type, per tier level) ââ */
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

/* ââ STATE ââ */
let estimateUnlocked = false;
let selectedTierName = null;
let selectedTierPrice = null;

/* ââ DOM REFS ââ */
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

/* ââ UTILITIES ââ */
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

/* ââ RESOLVE INDUSTRY (handles "Other" option) ââ */
function resolveIndustry(payload){
  return (payload.industry === "Other"
    ? (payload.otherIndustry || "").trim() || "Other"
    : payload.industry) || "";
}

/* ââ GET FORM PAYLOAD ââ */
function getPayload(){
  if(!quoteForm) return null;
  const fd = new FormData(quoteForm);
  const p  = Object.fromEntries(fd.entries());
  p.goals    = collectMultiSelect("goals");
  p.features = collectMultiSelect("features");
  return p;
}

/* ââ COMPUTE ESTIMATE ââ */
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
    formattedRange: `${formatCurrency(low)} â ${formatCurrency(high)}`,
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

/* ââ BUILD TIER OPTIONS ââ */
function buildTierOptions(estimate, payload){
  const pt   = payload.projectType || "business-website-build";
  const ptKey = pt.replace(/-/g,"").replace("websitecareplan","websitecarep");
  const isCarePlan = pt === "website-care-plan";

  const low  = isCarePlan ? (estimate.monthlyRange?.low  || estimate.range.low)  : estimate.range.low;
  const high = isCarePlan ? (estimate.monthlyRange?.high || estimate.range.high) : estimate.range.high;
  const mid  = roundTo50((low + high) / 2);

  const suffix = isCarePlan ? "/mo" : "";
ÛÛÝX]\\ÈHY\X]\\ÖÜHY\X]\\ÖÈ\Ú[\ÜË]ÙXÚ]KXZ[NÂÊ\ÛÛ[^Y[YHÝ][Y[\ÙYÛÛØ[È
ÂÛÛÝYYÔÑSÈH^[ØYÛØ[Ë[ÛY\Ê[\ÝHÑSËÛØØ[\ØÛÝ\HH^[ØYX]\\Ë[ÛY\ÊØØ[ÑSÈYÙ\ÈNÂÛÛÝYYÐYÈH^[ØYÛØ[Ë[ÛY\Ê][ÚZYYÈNÂÛÛÝYYÐÛÚÚ[ÈH^[ØYÛØ[Ë[ÛY\ÊÛÚÈ\Ú[Y[ÈH^[ØYX]\\Ë[ÛY\ÊØ[[\ÛÚÚ[ÈNÂÛÛÝYYÐÔHH^[ØYX]\\Ë[ÛY\ÊÔKÙ[XZ[[YÜ][ÛNÂ[Ý[Û[YS[JY\^ÂYY\OOH][Ú^ÂYYYÐÛÚÚ[ÊH]\Ù]]H\ÝÚ]HÛX[ÛÚÚ[È]8 %Ý\Ø\\[È\Ú[Y[ÈYÚ]Ø^KÂYYYÐYÊH]\HÛÛYYÙHXYHÈ[YÈÈ8 %ÛX[ÝXÝ\KÛX\ÕK\ÝØY[YKÂ]\Ù]HÙ\ÜÚ[Û[ÙX\Ù[ÙH]H\Ý8 %HÛX[\Ý[ÜÝØÝ\ÙY\Ú[ÛÙ[Ý\ÚXÝÂBYY\OOHÜÝÝ^ÂYYYÔÑSÊH]\HÝÛÙ\Ý[[ÙHÙ\ÝÛÙ[ÑSÈÝXÝ\H8 %Z[È[È[ÛÛ\ÂYYYÐÛÚÚ[ÊH]\[ÜH\ÝÚYÛ[È
ÈHÛÚÚ[ÈÞ\Ý[H]ÛÜÜÈ8 %H][[ÜÝÛY[ÈÙYHHÛX\\ÝÒHÛÂYYYÐÔJH]\[YÜ]YÚ][Ý\ÔHÛÈ]\HXY\ÈØ\\YXÚÙY[ÛÝÙY\]]ÛX]XØ[KÂ]\[ÜHÛÙÝÛÙ\ÛÛ\Ú[ÛÝË[H\[ÜÝÛX[\Ú[\ÜÙ\ÈXÝX[HYYÈÛÚÈ\ÝX\ÚYÂBÊ]]Ü]H
ÂYYYÔÑSÊH]\X^[][HÑSÈ\8 %Ù\XÙKX\XHYÙ\ËÝXÝ\YÛÛ[[]]Ü]HÚYÛ[È]ÛÛ\Ý[Ý\[YKÂYYYÐYÊH]\Z[ÜØØ[NY\XYH[[ÈÝ\Ü[[[]XÜË[ÔH[YÜ][ÛÛH^HÛKÂ]\H[ÜÝÛÛ\]H\Ú[Û8 %\ÚYÛYÜ\Ú[\ÜÙ\ÈÚ\H\Ý\[\ÝZ[\\ÜÚ[Û]X[]HX]\[ÜÝÂBÛÛÝY\[Y\ÈH\ÐØ\T[ÈÈ\ÜÙ[X[Ø\HÜÝÝØ\H[Ü]HØ\HHÈ][ÚÜÝÝ]]Ü]HNÂÛÛÝY\YÙ\ÈHÈX[\Ý][ÜÝ[[ÙY[ÜÝÛÛ\]HNÂÛÛÝY\][\ÈHÂ\ÐØ\T[È\ÝÜ\Ú[\ÜÙ\È]XZ[HYY\ÙY\[YÚÝ\Ü\ÝÜÙ][È]H]ZXÚÛHÚ]HÛX[Ù\ÜÚ[Û[\Ù[ÙK\ÐØ\T[È\Ý[[ÙHÙÛÛÚ[È[\Ý[Y[È[ÝXYHÝ\Ü\ÝÜ[ÜÝÛX[\Ú[\ÜÙ\È]Ø[ÝÛÙ\\Ý
ÈÛÛ\Ú[Û\ÐØ\T[È\ÝÜ\Ú[\ÜÙ\È]Ø[HØXÝ]K[Ë[ÛÙXÚ]H\\\ÝÜ\Ú[\ÜÙ\ÈÚ\H]]Ü]K\ÜÛÛ\^]HX]\[ÜÝNÂÛÛÝY\XÙ\ÈHÂ	ÙÜX]Ý\[ÞJÝÊ_IÜÝY^X	ÙÜX]Ý\[ÞJZY
_IÜÝY^X	ÙÜX]Ý\[ÞJYÚ
_IÜÝY^XNÂÛÛÝY\Ý[[X\Y\ÈHÂ\ÐØ\T[È[XXH[ÛH\ÙY\Ú]\]\ËXZ[[[ÙK[YÚÑSÈÝ\ÜHÛX[ÜYXH][ÚÚ]HÛÜH\ÜÙ[X[È[YÙ\ÜÚ[Û[K\ÐØ\T[ÈHÝÛÙ\Ý[[ÙHÙÛÛÚ[ÈÝ\Ü[\Ý[Y[Ë[ÜÝÝYØÝ\ÙY\ÙY\HÝÛÙ\Ý[[ÙHÙÛ\ÚÛÙ[ÛÛ\Ú[Û\Ü[ÜÝ\Ú[\ÜÙ\Ë\ÐØ\T[ÈH[ÜÝ[Ë[ÛÜ[Û8 %ØXÝ]HÝ\ÜÝ]YÞHØ[Ë[\Ý\\ÜÛÙKH[ÜÝ][ÜY\Ú[Û8 %[ÜH\[ÜHY[[Y[[[ÜHÝ]YÚXÈXXÚNÂÛÛÝY\Ù^\ÈHÈ][ÚÜÝÝ]]Ü]HNÂ]\Y\[Y\ËX\

[YKJHO
ÂYÙNY\YÙ\ÖÚWK[YKXÙSX[Y\XÙ\ÖÚWK]Y\][\ÖÚWKÝ[[X\NY\Ý[[X\Y\ÖÚWK[YS[N[YS[JY\Ù^\ÖÚWJKÚ[ÎX]\\ÖÝY\Ù^\ÖÚWWH×BJJNÂBÊ8¥ 8¥ STQTÐTÈ8¥ 8¥ 
Â[Ý[Û[\Y\Ü[ÛÊY\Ê^ÂÛÛÝÛÛZ[\HØÝ[Y[Ù][[Y[RY
Ù\]Y\YÜYNÂYXÛÛZ[\H]\ÂÛÛZ[\[\SHY\ËX\

Y\[^
HO\XÛHÛ\ÜÏHÙ\]Y\Ú[^OOLOÈÙ\]Y\YX]\YH	Ú[^OOLHÈ	Ï]Û\ÜÏHY\ZYÚYÚ¸«dXÛÛ[Y[YÙ]	ÈB]Û\ÜÏHY\]Ü[HÜ[Û\ÜÏHY\\Ý\Ü[Û	ÔÝ[Ê[^
ÌJKYÝ\
_OÜÜ[]Û\ÜÏHY\XYÙHÙ\ØØ\R[
Y\YÙJ_OÙ]Ù]]Û\ÜÏHY\ZXY]Û\ÜÏHY\]]KXØÚÈ
Ù\ØØ\R[
Y\[YJ_OÚ
Û\ÜÏHY\\Ý[[X\HÙ\ØØ\R[
Y\Ý[[X\J_OÜÙ]]Û\ÜÏHY\\XÙKXØÚÈÜ[Û\ÜÏHY\\XÙK\Y^Ý\[È]ÜÜ[]Û\ÜÏHY\\XÙHÙ\ØØ\R[
Y\XÙSX[
_OÙ]Ù]Ù]]Û\ÜÏHY\Y]Ù\ØØ\R[
Y\[YS[J_OÙ][	ÝY\Ú[ËX\
OOÙ\ØØ\R[

_OÛO
KÚ[_BÝ[]ÛÛ\ÜÏHY\\Ù[XÝX\OH]Û]K]Y\Z[^HÚ[^H]K]Y\[[YOHÙ\ØØ\R[
Y\[YJ_H]K]Y\\XÙOHÙ\ØØ\R[
Y\XÙSX[
_HÛÛXÚÏHÙ[XÝY\\ÊHÙ[XÝ	Ù\ØØ\R[
Y\[YJ_OØ]ÛØ\XÛO
KÚ[NÂBÊ8¥ 8¥ STÕHÔÕÓ8¥ 8¥ 
ÂÚ[ÝË[R[\ÝPÚ[ÙHH[Ý[ÛÙ[XÝ
^ÂÛÛÝÝ\ÜÝ\HØÝ[Y[Ù][[Y[RY
Ý\Z[\ÝKYÜÝ\NÂY[Ý\ÜÝ\
H]\ÂYÙ[XÝ[YHOOHÝ\^ÂÝ\ÜÝ\Ý[K\Ü^HHÂØÝ[Y[Ù][[Y[RY
Ý\[\ÝHOËØÝ\Ê
NÂH[ÙHÂÝ\ÜÝ\Ý[K\Ü^HHÛHÂÛÛÝÝ\[]HØÝ[Y[Ù][[Y[RY
Ý\[\ÝHNÂYÝ\[]
HÝ\[][YHHÂBNÂÊ8¥ 8¥ QTÑSPÕSÓ8¥ 8¥ 
ÂÚ[ÝËÙ[XÝY\H[Ý[Û^ÂØÝ[Y[]Y\TÙ[XÝÜ[
Y\\Ù[XÝXKÜXXÚ
OÂÛ\ÜÓ\Ý[[ÝJÙ[XÝYNÂ^ÛÛ[HÙ[XÝ	Ø]\Ù]Y\[Y_XÂJNÂÛ\ÜÓ\ÝY
Ù[XÝYNÂÙ[XÝYY\[YHH]\Ù]Y\[YNÂÙ[XÝYY\XÙHH]\Ù]Y\XÙNÂ^ÛÛ[H8§$È	ÜÙ[XÝYY\[Y_HÙ[XÝVF° ¢ò¢Væ&ÆRFR7V&ÖB'WGFöâæ÷rFBFW"26÷6Vâ¢ð¢b&W7VÇE7V&ÖD'Fâ°¢&W7VÇE7V&ÖD'FâæF6&ÆVBÒfÇ6S°¢&W7VÇE7V&ÖD'Fâç7GÆRæ÷6GÒ##°¢&W7VÇE7V&ÖD'Fâç7GÆRæ7W'6÷"Ò'öçFW"#°¢Ð¢bFW%&WV&VDæ÷FR°¢FW%&WV&VDæ÷FRçFWD6öçFVçBÒG·6VÆV7FVEFW$æÖWÒ6VÆV7FVB(	B&W727V&ÖBFò6VæB÷W"V÷FRæ°¢Ð§Ó° ¢ò¢)H)HU%45Bò$TBôddU"DD)H)H¢ð¦gVæ7FöâW'67DöffW$FFFF°¢G'²væF÷ræÆö6Å7F÷&vRç6WDFVÒôddU%õ5Dõ$tRÂ¥4ôâç7G&ævgFF²Ð¢6F6R²6öç6öÆRçv&â%Væ&ÆRFòW'67BöffW"FF"ÂR²Ð§Ð¦gVæ7Föâ&VDöffW$FF°¢G'²6öç7B#×væF÷ræÆö6Å7F÷&vRævWDFVÒôddU%õ5Dõ$tR²&WGW&â#ô¥4ôâç'6R"¦çVÆÃ²Ð¢6F6R²&WGW&âçVÆÃ²Ð§Ð ¢ò¢)H)HõTâò4Äõ4RôddU"4TUB)H)H¢ð¦gVæ7Föâ÷VäöffW$WW&Væ6R°¢b7V66W75æVÂ&WGW&ã°¢7V66W75æVÂæ6Æ74Æ7Bç&VÖ÷fR&FFVâ"°¢7V66W75æVÂç6WDGG&'WFR&&ÖFFVâ"Â&fÇ6R"°¢Fö7VÖVçBæ&öGç7GÆRæ÷fW&fÆ÷sÒ&FFVâ#°¢6WEFÖV÷WBÓç°¢7V66W75æVÂæ6Æ74Æ7BæFB&2×f6&ÆR"°¢öffW$FÆösòæfö7W2°¢ò¢æÖFRFR6VÆÂâ¢ð¢6WEFÖV÷WBÓç°¢öffW$FÆösòæ6Æ74Æ7BæFB'6VÆÂ×f6&ÆR"°¢ÒÂc°¢ò¢7FvvW"FW"6&G2â¢ð¢6WEFÖV÷WBÓç°¢Fö7VÖVçBçVW'6VÆV7F÷$ÆÂ"æöffW"×FW""æf÷$V66&CÓç°¢6&Bæ6Æ74Æ7BæFB'FW"×f6&ÆR"°¢Ò°¢ÒÂ#°¢ÒÂ°§Ð¦gVæ7Föâ6Æ÷6TöffW$WW&Væ6R°¢b7V66W75æVÂ&WGW&ã°¢7V66W75æVÂæ6Æ74Æ7Bç&VÖ÷fR&2×f6&ÆR"°¢7V66W75æVÂç6WDGG&'WFR&&ÖFFVâ"Â'G'VR"°¢Fö7VÖVçBæ&öGç7GÆRæ÷fW&fÆ÷sÒ"#°¢öffW$FÆösòæ6Æ74Æ7Bç&VÖ÷fR'6VÆÂ×f6&ÆR"°¢6WEFÖV÷WBÓç°¢b7V66W75æVÂæ6Æ74Æ7Bæ6öçFç2&2×f6&ÆR"°¢7V66W75æVÂæ6Æ74Æ7BæFB&FFVâ"°¢ò¢&W6WBFW"6&BæÖFöç2f÷"æWB÷Vâ¢ð¢Fö7VÖVçBçVW'6VÆV7F÷$ÆÂ"æöffW"×FW""æf÷$V63Óæ2æ6Æ74Æ7Bç&VÖ÷fR'FW"×f6&ÆR"°¢Ð¢ÒÂC#°§Ð ¢ò¢)H)H%TÄB5T$Ô54ôâÄôB÷&væÂ(	Bf÷"W7FærvV&öö²Æöv2)H)H¢ð¦gVæ7Föâ'VÆE7V&Ö76öåÆöBÆöBÂW7FÖFRÂFW'3ÕµÒÂ6VÆV7FVEFW#ÖçVÆÂ°¢6öç7BæÖRÒ·ÆöBæf'7DæÖRÂÆöBæÆ7DæÖUÒæfÇFW"&ööÆVâæ¦öâ""ÇÂÆöBæ6ö×çÇÂ%&ö¦V7BÆVB#°¢6öç7BFW%7VÖÖ'ÒFW'2æÆVæwF¢òFW'2æÖCÓæG·BææÖWÓ¢G·Bç&6TÆ&VÇÖæ¦öâ"Â"¢¢$æ÷BvVæW&FVB#°¢&WGW&â°¢6÷W&6S¢%GW&æ¶WvV"V÷FR'VÆFW""À¢7V&ÖGFVDC¢æWrFFRçFô4õ7G&ærÀ¢æÖRÀ¢6ö×ç¢ÆöBæ6ö×çÇÂ""À¢VÖÃ¢ÆöBæVÖÂÇÂ""À¢öæS¢ÆöBçöæRÇÂ""À¢æGW7G'¢&W6öÇfTæGW7G'ÆöBÀ¢W7FæuvV'6FS¢ÆöBæW7FæuvV'6FRÇÂ""À¢&ö¦V7EGS¢W7FÖFRç&V6öÖÖVæFVE6¶vRÀ¢FÖVÆæS¢ÆöBçFÖVÆæRÇÂ""À¢'VFvWD&æC¢ÆöBæ'VFvWD&æBÇÂ""À¢vT6÷VçC¢ÆöBçvT6÷VçD&æBÇÂ""À¢vöÇ3¢ÆöBævöÇ2ÇÅµÒæ¦öâ"Â"À¢fVGW&W3¢ÆöBæfVGW&W2ÇÅµÒæ¦öâ"Â"À¢æ÷FW3¢ÆöBææ÷FW2ÇÂ""À¢W7FÖFU&ævS¢W7FÖFRæf÷&ÖGFVE&ævRÀ¢FW$÷Föç3¢FW%7VÖÖ'À¢6VÆV7FVEFW#¢6VÆV7FVEFW"òG·6VÆV7FVEFW"ææÖWÒG·6VÆV7FVEFW"ç&6WÒ¢$æ÷B6VÆV7FVB"À¢FDöç3¢W7FÖFRæFDöç2æ¦öâ"Â"ÇÂ$æöæR ¢Ó°§Ð ¢ò¢)H)H%TÄBÄTBÔ4EU$RÄôBcc¢f&W2öâ$vWB×V÷FR")H)H¢ð¦gVæ7Föâ'VÆDÆVD6GW&UÆöBÆöBÂW7FÖFR°¢&WGW&â°¢6÷W&6S¢%D²vV"ÆVB6GW&R"À¢7V&ÖGFVDC¢æWrFFRçFô4õ7G&ærÀ¢f'7DæÖS¢ÆöBæf'7DæÖRÇÂ""À¢6ö×ç¢ÆöBæ6ö×çÇÂ""À¢öæS¢ÆöBçöæRÇÂ""À¢æGW7G'¢&W6öÇfTæGW7G'ÆöBÀ¢W7FæuvV'6FS¢ÆöBæW7FæuvV'6FRÇÂ""À¢&ö¦V7EGS¢W7FÖFRç&V6öÖÖVæFVE6¶vRÀ¢vT6÷VçC¢ÆöBçvT6÷VçD&æBÇÂ""À¢FÖVÆæS¢ÆöBçFÖVÆæRÇÂ""À¢'VFvWD&æC¢ÆöBæ'VFvWD&æBÇÂ""À¢vöÇ3¢ÆöBævöÇ2ÇÅµÒæ¦öâ"Â"À¢fVGW&W3¢ÆöBæfVGW&W2ÇÅµÒæ¦öâ"Â"À¢æ÷FW3¢ÆöBææ÷FW2ÇÂ""À¢VÖÃ¢ÆöBæVÖÂÇÂ""À¢W7FÖFU&ævS¢W7FÖFRæf÷&ÖGFVE&ævP¢Ó°§Ð ¢ò¢)H)H%TÄBDU"ÕUDDRÄôBcc¢f&W2öâ%7V&ÖB")H)H¢ð¦gVæ7Föâ'VÆEFW%WFFUÆöBÆöBÂW7FÖFRÂFW'2Â6VÆV7FVEFW"°¢&WGW&â°¢6÷W&6S¢%D²vV"FW"6VÆV7Föâ"À¢7V&ÖGFVDC¢æWrFFRçFô4õ7G&ærÀ¢VÖÃ¢ÆöBæVÖÂÇÂ""À¢W7FÖFU&ævS¢W7FÖFRæf÷&ÖGFVE&ævRÀ¢6VÆV7FVEFW#¢G·6VÆV7FVEFW"ææÖWÒG·6VÆV7FVEFW"ç&6WÒÀ¢FW$÷Föç3¢FW'2æÖBÓâG·BææÖWÓ¢G·Bç&6TÆ&VÇÖæ¦öâ"Â"À¢ò¢gVÆÂÆVBFF2fÆÆ&6²bæòÖF6ær&÷rW7G2¢ð¢f'7DæÖS¢ÆöBæf'7DæÖRÇÂ""À¢6ö×ç¢ÆöBæ6ö×çÇÂ""À¢öæS¢ÆöBçöæRÇÂ""À¢æGW7G'¢&W6öÇfTæGW7G'ÆöBÀ¢W7FæuvV'6FS¢ÆöBæW7FæuvV'6FRÇÂ""À¢&ö¦V7EGS¢W7FÖFRç&V6öÖÖVæFVE6¶vRÀ¢vT6÷VçC¢ÆöBçvT6÷VçD&æBÇÂ""À¢FÖVÆæS¢ÆöBçFÖVÆæRÇÂ""À¢'VFvWD&æC¢ÆöBæ'VFvWD&æBÇÂ""À¢vöÇ3¢ÆöBævöÇ2ÇÅµÒæ¦öâ"Â"À¢fVGW&W3¢ÆöBæfVGW&W2ÇÅµÒæ¦öâ"Â"À¢æ÷FW3¢ÆöBææ÷FW2ÇÂ" ¢Ó°§Ð ¢ò¢)H)H5T$ÔBDòtT$ôô²)H)H¢ð¦7æ2gVæ7Föâ7V&ÖEFõvV&öö²FF°¢6öç7B&W2ÒvBfWF6tT$ôôµõU$ÂÂ°¢ÖWFöC¢%õ5B"À¢ÖöFS¢&æòÖ6÷'2"Âò¢t2vV&öö²&WV&W2æòÖ6÷'2¢ð¢VFW'3¢²$6öçFVçBÕGR#¢&Æ6Föâö§6öâ"ÒÀ¢&öG¢¥4ôâç7G&ævgFF¢Ò°¢ò¢æòÖ6÷'2&W7öç6W2&R÷VR(	BG&VBçæöâ×F&÷r27V66W72¢ð¢&WGW&âG'VS°§Ð ¢ò¢)H)H$TäDU"$UdUr4$B)H)H¢ð¦gVæ7Föâ&VæFW%&WfWrÆöB°¢6öç7BW7BÒ6ö×WFTW7FÖFRÆöB°¢6WEFWB'&WfWr×6¶vR"ÂW7Bç&V6öÖÖVæFVE6¶vR°¢6WEFWB'&WfWr×&ævR"ÂW7Bæf÷&ÖGFVE&ævR°¢6WEFWB'&WfWrÖ6öæfFVæ6R"ÂW7Bæ6öæfFVæ6RçFõWW$66R°¢6WEFWB'&WfWr×vW2"ÂÆöBçvT6÷VçD&æBÇÂ#"Ó2vW2"°¢6WEFWB'&WfWr×FÖVÆæR"ÂÆöBçFÖVÆæRÇÂ$æWB3ÓcF2"°¢6WEFWB'&WfWrÖvöÇ2Ö6÷VçB"Â7G&ærÆöBævöÇ2æÆVæwF°¢6WEFWB'&WfWrÖfVGW&W2Ö6÷VçB"Å7G&ærÆöBæfVGW&W2æÆVæwF°¢6WEFWB'&WfWrÖFFöç2"ÂW7BæFDöç2æÆVæwFòW7BæFDöç2æ¦öâ"Â"¢$æòWG&FBÖöç27VvvW7FVBWBâ"°¢6WEFWB'&WfWr×&FöæÆR"ÂW7Bç&FöæÆRæ¦öâ"(	2"°¢6WEFWB'&WfWrÖÖöçFÇ"À¢W7BæÖöçFÇ&ævP¢òÖöçFÇwVFæ6RG¶f÷&ÖD7W'&Væ7W7BæÖöçFÇ&ævRæÆ÷rÒ(	2G¶f÷&ÖD7W'&Væ7W7BæÖöçFÇ&ævRævÖ ¢¢$öæR×FÖR&ö¦V7B&ævR ¢°¢&WGW&âW7C°§Ð ¢ò¢)H)HUDDRÄô4²5DDR)H)H¢ð¦gVæ7FöâWFFTÆö6µ7FFR°¢6öç7B4VÖÂÒfÆDVÖÂVÖÄçWCòçfÇVR°¢6öç7BVæÆö6¶VBÒW7FÖFUVæÆö6¶VBbb4VÖÃ°¢W7FÖFT6&Còæ6Æ74Æ7BçFövvÆR&Æö6¶VB"ÂVæÆö6¶VB°¢b7FGW4æöFR°¢b4VÖÂ7FGW4æöFRçFWD6öçFVçBÒ$VçFW"÷W"VÖÂÆ7BæB&W72vWB×V÷FRFò&WfVÂ÷W"F&VR÷Föç2â#°¢VÇ6RbW7FÖFUVæÆö6¶VB7FGW4æöFRçFWD6öçFVçBÒ%&W72vWB×V÷FRFò÷Vâ÷W"7W7FöÒV÷FRâ#°¢VÇ6R7FGW4æöFRçFWD6öçFVçBÒ%÷W"V÷FR'VÆFW"&W7VÇG2&R&VG(	B6ö÷6R÷W"FW"æB&W727V&ÖBâ#°¢Ð¢&WGW&âVæÆö6¶VC°§Ð¦gVæ7FöâWFFT6ö6UÆÇ2°¢Fö7VÖVçBçVW'6VÆV7F÷$ÆÂ"æ6ö6R×ÆÂ"æf÷$V6ÆÃÓç°¢ÆÂæ6Æ74Æ7BçFövvÆR&2×6VÆV7FVB"Â&ööÆVâÆÂçVW'6VÆV7F÷"&çWB"òæ6V6¶VB°¢Ò°§Ð ¢ò¢)H)H$TäDU"5T44U52òôddU"tR)H)H¢ð¦gVæ7Föâ&VæFW%7V66W72W7FÖFRÂÆöB°¢6öç7BFW'2Ò'VÆEFW$÷Föç2W7FÖFRÂÆöB° ¢ò¢&W6WBFW"6VÆV7Föâ7FFR¢ð¢6VÆV7FVEFW$æÖRÒçVÆÃ°¢6VÆV7FVEFW%&6RÒçVÆÃ°¢b&W7VÇE7V&ÖD'Fâ°¢&W7VÇE7V&ÖD'FâæF6&ÆVBÒG'VS°¢&W7VÇE7V&ÖD'Fâç7GÆRæ÷6GÒ#ãB#°¢&W7VÇE7V&ÖD'Fâç7GÆRæ7W'6÷"Ò&æ÷BÖÆÆ÷vVB#°¢&W7VÇE7V&ÖD'FâçFWD6öçFVçBÒ%7V&ÖB#°¢Ð¢bFW%&WV&VDæ÷FRFW%&WV&VDæ÷FRçFWD6öçFVçBÒ%6VÆV7BFW"&÷fRFò7V&ÖB÷W"V÷FRâ#° ¢&VæFW%FW$÷Föç2FW'2° ¢6WEFWB'&W7VÇB×6¶vR"ÂW&Rw2÷W"7W7FöÒV÷FRÂG·ÆöBæf'7DæÖRÇÂ&g&VæB'Òæ°¢6WEFWB'&W7VÇB×&ævR"À¢ÆöBç&ö¦V7EGRÓÓÒ'vV'6FRÖ6&R×Æâ"bbW7FÖFRæÖöçFÇ&ævP¢òG¶f÷&ÖD7W'&Væ7W7FÖFRæÖöçFÇ&ævRæÆ÷rÒ(	2G¶f÷&ÖD7W'&Væ7W7FÖFRæÖöçFÇ&ævRævÒöÖö ¢¢W7FÖFRæf÷&ÖGFVE&ævP¢°¢6WEFWB'&W7VÇBÖFFöç2"À¢W7FÖFRæFDöç2æÆVæwF¢ò7VvvW7FVBWG&2&6VBöâ÷W"çWG3¢G¶W7FÖFRæFDöç2æ¦öâ"Â"Òæ ¢¢$æòÖ¦÷"FBÖöç2&R&VærW6VBâb÷RvçBÖ÷&R4TòFWFÂçFVw&Föç2Â÷"6×vâ7W÷'BÂvR6â66÷RFBçFòFRfW'6öâ÷R6ö÷6Râ ¢°¢6WEFWB'&W7VÇB×&FöæÆR"À¢&6VBöâ÷W"G¶W7FÖFRç&V6öÖÖVæFVE6¶vWÒ66÷R(	B6²FRÆWfVÂöböÆ6æBFWFFBfG2÷W"vöÇ2æBFÖVÆæRâ6VÆV7BFW"&VÆ÷rÂFVâ&W727V&ÖBæ ¢° ¢ò¢v&R7V&ÖB'WGFöâ¢ð¢b&W7VÇE7V&ÖD'Fâ°¢&W7VÇE7V&ÖD'Fâæöæ6Æ6²Ò7æ2Óâ°¢b6VÆV7FVEFW$æÖR²&WGW&ã²Ð¢6öç7B'FâÒ&W7VÇE7V&ÖD'Fã°¢'FâæF6&ÆVBÒG'VS°¢'FâçFWD6öçFVçBÒ%6VæFæ~(
b#° ¢ò¢÷&væÂÆöBf÷"W7FærvV&öö²Æöv2¢ð¢6öç7B7V&Ö76öäFFÒ'VÆE7V&Ö76öåÆöBÆöBÂW7FÖFRÂFW'2Â°¢æÖS¢6VÆV7FVEFW$æÖRÀ¢&6S¢6VÆV7FVEFW%&6P¢Ò° ¢ò¢cc¢FW"×WFFRÆöBWFFW2FRD²vV"6VWB&÷r¢ð¢6öç7BFW%WFFTFFÒ'VÆEFW%WFFUÆöBÆöBÂW7FÖFRÂFW'2Â°¢æÖS¢6VÆV7FVEFW$æÖRÀ¢&6S¢6VÆV7FVEFW%&6P¢Ò° ¢G'°¢ò¢6VæB&÷F¢÷&væÂvV&öö²²FW"WFFRFòD²vV"6VWB¢ð¢vB&öÖ6RæÆÂ°¢7V&ÖEFõvV&öö²7V&Ö76öäFFÀ¢7V&ÖEFõvV&öö²FW%WFFTFF¢Ò°¢'FâçFWD6öçFVçBÒ.)É2V÷FR6VçB#°¢'Fâç7GÆRæ&6¶w&÷VæBÒ&ÆæV"Öw&FVçB3VFVrÂ3f3FÂ3S6B#°¢bFW%&WV&VDæ÷FRFW%&WV&VDæ÷FRçFWD6öçFVçBÒ%÷W"V÷FR2&VVâ7V&ÖGFVB(	BFRGW&æ¶WFVÒvÆÂ&RâF÷V66÷'FÇâ#°¢Ò6F6W'"°¢6öç6öÆRæW'&÷"%vV&öö²W'&÷#¢"ÂW'"°¢'FâçFWD6öçFVçBÒ%7V&ÖB#°¢'FâæF6&ÆVBÒfÇ6S°¢'Fâç7GÆRæ÷6GÒ##°¢bFW%&WV&VDæ÷FRFW%&WV&VDæ÷FRçFWD6öçFVçBÒ%6öÖWFærvVçBw&öær(	BÆV6RG'vââ#°¢Ð¢Ó°¢Ð ¢W'67DöffW$FF²ÆöBÂW7FÖFRÂFW'2ÂvVæW&FVDC¢æWrFFRçFô4õ7G&ærÒ°¢÷VäöffW$WW&Væ6R°§Ð ¢ò¢)H)H5T$ÔBäDÄU")H)H¢ð¦7æ2gVæ7Föâ7V&ÖDW7FÖFRR°¢Rç&WfVçDFVfVÇB°¢6öç7BÆöBÒvWEÆöB°¢bÆöBÇÂV÷FTf÷&Òç&W÷'EfÆFG&WGW&ã° ¢W7FÖFUVæÆö6¶VBÒG'VS°¢6öç7BVæÆö6¶VBÒWFFTÆö6µ7FFR°¢bVæÆö6¶VB²VÖÄçWCòæfö7W2²&WGW&ã²Ð ¢6öç7BW7FÖFRÒ&VæFW%&WfWrÆöB°¢6öç7B'FâÒFö7VÖVçBævWDVÆVÖVçD'B&W7FÖFR×7V&ÖB"°¢b'Fâ²'FâæF6&ÆVC×G'VS²'FâçFWD6öçFVçCÒ$'VÆFær÷W"V÷F^(
b#²Ð ¢G'°¢ò¢cc¢f&RÆVB6GW&RFòD²vV"6VWBæöâÖ&Æö6¶ær¢ð¢6öç7BÆVDFFÒ'VÆDÆVD6GW&UÆöBÆöBÂW7FÖFR°¢7V&ÖEFõvV&öö²ÆVDFFæ6F6W'"Óà¢6öç6öÆRçv&â$ÆVB6GW&RvV&öö²W'&÷#¢"ÂW'"¢° ¢&VæFW%7V66W72W7FÖFRÂÆöB°¢b7FGW4æöFR7FGW4æöFRçFWD6öçFVçBÒ$÷Væær÷W"7W7FöÒV÷FRæ÷râ#°¢Ò6F6W'"°¢&VæFW%7V66W72W7FÖFRÂÆöB°¢ÒfæÆÇ°¢b'Fâ²'FâæF6&ÆVCÖfÇ6S²'FâçFWD6öçFVçCÒ$vWB×V÷FR(i"#²Ð¢Ð§Ð ¢ò¢)H)HUdTåBÄ5DTäU%2)H)H¢ð§V÷FTf÷&ÓòæFDWfVçDÆ7FVæW"&çWB"ÂÓç°¢WFFT6ö6UÆÇ2°¢6öç7BÒvWEÆöB°¢b&VæFW%&WfWr°¢bfÆDVÖÂVÖÄçWCòçfÇVR²W7FÖFUVæÆö6¶VCÖfÇ6S²Ð¢WFFTÆö6µ7FFR°§Ò°§V÷FTf÷&ÓòæFDWfVçDÆ7FVæW"&6ævR"ÂWFFT6ö6UÆÇ2°§V÷FTf÷&ÓòæFDWfVçDÆ7FVæW"'7V&ÖB"Â7V&ÖDW7FÖFR° ¦öffW$6Æ÷6T'FãòæFDWfVçDÆ7FVæW"&6Æ6²"Â6Æ÷6TöffW$WW&Væ6R°§7V66W75æVÃòæFDWfVçDÆ7FVæW"&6Æ6²"ÂSÓç°¢bRçF&vWCòæ4GG&'WFR&FFÖöffW"Ö6Æ÷6R"6Æ÷6TöffW$WW&Væ6R°§Ò°¦Fö7VÖVçBæFDWfVçDÆ7FVæW"&¶WF÷vâ"ÂSÓç°¢bRæ¶WÓÓÒ$W66R"bb7V66W75æVÃòæ6Æ74Æ7Bæ6öçFç2&2×f6&ÆR"6Æ÷6TöffW$WW&Væ6R°§Ò° ¢ò¢)H)H45$ôÄÂ$UdTÂ)H)H¢ð¦gVæ7Föâ&WfVÄöå67&öÆÂ°¢6öç7BæöFW2ÒFö7VÖVçBçVW'6VÆV7F÷$ÆÂ%¶FF×&WfVÅÒ"°¢æöFW2æf÷$V6ãÓç°¢6öç7BFVÆÒçVÖ&W"âæFF6WBç&WfVÄFVÆÇÃ°¢âç7GÆRç6WE&÷W'G"Ò×&WfVÂÖFVÆ"ÂFVÆ²&×2"°¢Ò° ¢6öç7Bö'2ÒæWrçFW'6V7Föäö'6W'fW"VçG&W3Óç°¢VçG&W2æf÷$V6VçG'Óç°¢bVçG'æ4çFW'6V7Fær°¢VçG'çF&vWBæ6Æ74Æ7BæFB&â×fWr"°¢ö'2çVæö'6W'fRVçG'çF&vWB°¢Ð¢Ò°¢ÒÇ·F&W6öÆC£ãRÂ&ö÷DÖ&vã¢#Ó#'Ò° ¢æöFW2æf÷$V6ãÓæö'2æö'6W'fRâ° ¢òòfÆÆ&6³¢f÷&6R×&WfVÂçFær7FÆÂâfWw÷'BgFW"C×0¢6WEFÖV÷WBÓç°¢æöFW2æf÷$V6ãÓç°¢6öç7B"ÒâævWD&÷VæFæt6ÆVçE&V7B°¢b"çF÷ÂvæF÷ræææW$VvBbb"æ&÷GFöÒâ°¢âæ6Æ74Æ7BæFB&â×fWr"°¢Ð¢Ò°¢ÒÂC°§Ð ¢ò¢)H)HtÄõr4$E2)H)H¢ð¦gVæ7Föâ&æDvÆ÷t6&G2°¢Fö7VÖVçBçVW'6VÆV7F÷$ÆÂ"ævÆ÷rÖ6&B"æf÷$V66&CÓç°¢6&BæFDWfVçDÆ7FVæW"'öçFW&Ö÷fR"ÂSÓç°¢6öç7B"Ò6&BævWD&÷VæFæt6ÆVçE&V7B°¢6&Bç7GÆRç6WE&÷W'G"ÒÖvÆ÷r×"ÆG²Ræ6ÆVçE×"æÆVgB÷"çvGF£ÒV°¢6&Bç7GÆRç6WE&÷W'G"ÒÖvÆ÷r×"ÆG²Ræ6ÆVçE×"çF÷÷"æVvB£ÒV°¢Ò°¢Ò°§Ð ¢ò¢)H)H$ÄÄ)H)H¢ð¦gVæ7Föâ&æE&ÆÆ°¢6öç7BæöFW2Ò'&æg&öÒFö7VÖVçBçVW'6VÆV7F÷$ÆÂ%¶FF×&ÆÆÒ"°¢bæöFW2æÆVæwFÇÂvæF÷ræææW%vGFÃ&WGW&ã°¢6öç7BÇÒÓç°¢6öç7BfÒvæF÷ræææW$VvGÇÃ°¢æöFW2æf÷$V6ãÓç°¢6öç7B"ÒâævWD&÷VæFæt6ÆVçE&V7B°¢6öç7B2ÒçVÖ&W"âæFF6WBç&ÆÆÇÃ°¢6öç7BBÒÖFæÖÖFæÖâ"çF÷·"æVvBó"×fó"÷fÃÂÓ§3°¢âç7GÆRçG&ç6f÷&ÓÖG&ç6ÆFS6BÂG·G×Ã°¢Ò°¢Ó°¢Ç°¢ÆWBF6³ÖfÇ6S°¢væF÷ræFDWfVçDÆ7FVæW"'67&öÆÂ"ÂÓç°¢bF6²&WGW&ã²F6³×G'VS°¢&WVW7DæÖFöäg&ÖRÓç²Ç²F6³ÖfÇ6S²Ò°¢ÒÇ·76fS§G'VWÒ°§Ð ¢ò¢)H)Häb45$ôÄÂ5DDR)H)H¢ð¦gVæ7Föâ&æDæb°¢6öç7BæbÒFö7VÖVçBçVW'6VÆV7F÷""çF÷Öæb"°¢bæb&WGW&ã°¢6öç7B6V6²ÒÓâæbæ6Æ74Æ7BçFövvÆR'67&öÆÆVB"ÂvæF÷rç67&öÆÅã#°¢væF÷ræFDWfVçDÆ7FVæW"'67&öÆÂ"Â6V6²Â·76fS§G'VWÒ°¢6V6²° ¢6öç7B"ÒFö7VÖVçBçVW'6VÆV7F÷""ææbÖÖ'W&vW""°¢6öç7BÖâÒFö7VÖVçBçVW'6VÆV7F÷""æÖö&ÆRÖæb"°¢b"bbÖâ°¢"æFDWfVçDÆ7FVæW"&6Æ6²"ÂÓç°¢"æ6Æ74Æ7BçFövvÆR&÷Vâ"°¢Öâæ6Æ74Æ7BçFövvÆR&÷Vâ"°¢Ò°¢ÖâçVW'6VÆV7F÷$ÆÂ&"æf÷$V6Óç°¢æFDWfVçDÆ7FVæW"&6Æ6²"ÂÓç²"æ6Æ74Æ7Bç&VÖ÷fR&÷Vâ"²Öâæ6Æ74Æ7Bç&VÖ÷fR&÷Vâ"²Ò°¢Ò°¢Ð§Ð ¢ò¢)H)HäB)H)H¢ð§WFFT6ö6UÆÇ2°§WFFTÆö6µ7FFR°¦bV÷FTf÷&Ò²&VæFW%&WfWrvWEÆöB²Ð§&WfVÄöå67&öÆÂ°¦&æDvÆ÷t6&G2°¦&æE&ÆÆ°¦&æDæb°
