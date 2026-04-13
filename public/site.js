async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return response.json();
}

function collectMultiSelect(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function getEstimatePayload(form) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.goals = collectMultiSelect("goals");
  payload.features = collectMultiSelect("features");
  return payload;
}

function renderPreview(estimate) {
  setText("preview-package", estimate.recommendedPackage);
  setText("preview-range", estimate.formattedRange);
  setText("preview-confidence", estimate.confidence.toUpperCase());
  setText("preview-pages", document.getElementById("pageCountBand")?.value || "2-5 pages");
  setText("preview-timeline", document.getElementById("timeline")?.value || "Next 30-60 days");
  setText("preview-goals-count", String(collectMultiSelect("goals").length));
  setText("preview-features-count", String(collectMultiSelect("features").length));
  setText(
    "preview-addons",
    estimate.addOns.length ? estimate.addOns.join(", ") : "No extra add-ons suggested yet."
  );
  setText("preview-rationale", estimate.rationale.join(" - "));
  setText(
    "preview-monthly",
    estimate.monthlyRange
      ? `Monthly guidance ${Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
          estimate.monthlyRange.low
        )}-${Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(estimate.monthlyRange.high)}`
      : "One-time project range"
  );
}

const estimateForm = document.getElementById("estimate-form");
const estimateStatus = document.getElementById("estimate-form-status");
const estimateSuccessPanel = document.getElementById("estimate-success-panel");

let previewTimer;

async function updatePreview() {
  if (!estimateForm) {
    return;
  }

  try {
    const result = await postJson("/api/estimate-preview", getEstimatePayload(estimateForm));
    if (!result.ok) {
      throw new Error(result.error || "Preview failed");
    }
    renderPreview(result.estimate);
  } catch (error) {
    if (estimateStatus) {
      estimateStatus.textContent = error.message || "Preview unavailable right now.";
    }
  }
}

function queuePreviewUpdate() {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    updatePreview().catch(() => null);
  }, 180);
}

if (estimateForm) {
  updatePreview().catch(() => null);

  estimateForm.addEventListener("input", queuePreviewUpdate);
  estimateForm.addEventListener("change", queuePreviewUpdate);

  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = estimateForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Building your estimate...";
    if (estimateStatus) {
      estimateStatus.textContent = "Creating your lead record and onboarding step...";
    }

    try {
      const result = await postJson("/api/estimate", getEstimatePayload(estimateForm));
      if (!result.ok) {
        throw new Error(result.error || "Estimate failed");
      }

      renderPreview(result.estimate);
      estimateSuccessPanel?.classList.remove("hidden");
      setText("result-package", result.estimate.recommendedPackage);
      setText("result-range", result.estimate.formattedRange);
      setText("result-confidence", result.estimate.confidence.toUpperCase());
      setText(
        "result-addons",
        result.estimate.addOns.length ? result.estimate.addOns.join(", ") : "No extra add-ons suggested yet."
      );
      setText("result-rationale", result.estimate.rationale.join(" - "));
      setText("result-lead-id", result.leadId);

      const onboardingLink = document.getElementById("result-onboarding-link");
      if (onboardingLink) {
        onboardingLink.href = result.onboardingUrl;
      }

      if (estimateStatus) {
        estimateStatus.textContent = "Estimate ready. Continue straight into onboarding when you are ready.";
      }

      estimateSuccessPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      window.alert(error.message || "Something went wrong while creating the estimate.");
      if (estimateStatus) {
        estimateStatus.textContent = "We could not create the estimate right now. Please try again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Get my estimate";
    }
  });
}
