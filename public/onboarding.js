const params = new URLSearchParams(window.location.search);
const leadId = params.get("leadId");

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

async function loadLead() {
  if (!leadId) {
    setText("lead-company", "Project not found");
    setText("lead-summary", "Open this page from a valid estimate result so the project details can be attached.");
    return;
  }

  const response = await fetch(`/api/leads/${leadId}`);
  const result = await response.json();
  if (!result.ok) {
    setText("lead-company", "Project not found");
    setText("lead-summary", result.error || "We could not load the project details.");
    return;
  }

  document.getElementById("leadId").value = leadId;
  const leadName = result.bundle.lead.company || `${result.bundle.lead.firstName} ${result.bundle.lead.lastName}`;
  const estimateRange = `${formatCurrency(result.bundle.estimate.priceLow)} - ${formatCurrency(result.bundle.estimate.priceHigh)}`;

  setText("lead-company", leadName);
  setText(
    "lead-summary",
    `${result.bundle.estimate.recommendedPackage || result.bundle.lead.projectType}. Estimated planning range ${estimateRange}. Complete the details below so we can start shaping the site around your business.`
  );
  setText("lead-package-pill", result.bundle.estimate.recommendedPackage || result.bundle.lead.projectType);
  setText("lead-range-pill", estimateRange);
}

const form = document.getElementById("onboarding-form");
form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Sending project details...";

  try {
    const payload = new FormData(form);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      body: payload
    });
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Onboarding failed");
    }

    const success = document.getElementById("onboarding-success");
    success.classList.remove("hidden");
    success.textContent = `Project details received. ${result.uploads.length} asset${result.uploads.length === 1 ? "" : "s"} uploaded and the project is ready for the first build.`;
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    window.alert(error.message || "Something went wrong while sending your project details.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send project details";
  }
});

loadLead().catch((error) => {
  setText("lead-company", "Project load failed");
  setText("lead-summary", error.message || "We could not load the project details.");
});
