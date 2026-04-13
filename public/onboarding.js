const params = new URLSearchParams(window.location.search);
const leadId = params.get("leadId");

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

async function loadLead() {
  if (!leadId) {
    setText("lead-company", "Lead not found");
    setText("lead-summary", "Open this page from a valid estimate result so the lead record is attached.");
    return;
  }

  const response = await fetch(`/api/leads/${leadId}`);
  const result = await response.json();
  if (!result.ok) {
    setText("lead-company", "Lead not found");
    setText("lead-summary", result.error || "We could not load the lead details.");
    return;
  }

  document.getElementById("leadId").value = leadId;
  setText("lead-company", result.bundle.lead.company || `${result.bundle.lead.firstName} ${result.bundle.lead.lastName}`);
  setText(
    "lead-summary",
    `Project type: ${result.bundle.lead.projectType}. Estimated range: $${Number(result.bundle.estimate.priceLow).toLocaleString()} - $${Number(result.bundle.estimate.priceHigh).toLocaleString()}.`
  );
}

const form = document.getElementById("onboarding-form");
form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Submitting onboarding...";

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
    success.textContent = `Onboarding submitted. ${result.uploads.length} assets attached and the lead is ready for draft generation.`;
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    window.alert(error.message || "Something went wrong while submitting onboarding.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit onboarding";
  }
});

loadLead().catch((error) => {
  setText("lead-company", "Lead load failed");
  setText("lead-summary", error.message || "We could not load the lead details.");
});
