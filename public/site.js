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

const estimateForm = document.getElementById("estimate-form");
if (estimateForm) {
  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(estimateForm);
    const payload = Object.fromEntries(formData.entries());
    payload.goals = collectMultiSelect("goals");
    payload.features = collectMultiSelect("features");

    const submitButton = estimateForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Building your estimate...";

    try {
      const result = await postJson("/api/estimate", payload);
      if (!result.ok) {
        throw new Error(result.error || "Estimate failed");
      }

      document.getElementById("estimate-result").classList.remove("hidden");
      setText("result-package", result.estimate.recommendedPackage);
      setText("result-range", result.estimate.formattedRange);
      setText("result-confidence", result.estimate.confidence.toUpperCase());
      setText("result-addons", result.estimate.addOns.length ? result.estimate.addOns.join(", ") : "No extra add-ons suggested yet.");
      setText("result-rationale", result.estimate.rationale.join(" • "));

      const onboardingLink = document.getElementById("result-onboarding-link");
      onboardingLink.href = result.onboardingUrl;
      onboardingLink.textContent = "Continue to onboarding";

      const leadValue = document.getElementById("result-lead-id");
      leadValue.textContent = result.leadId;
      document.getElementById("estimate-result").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      window.alert(error.message || "Something went wrong while creating the estimate.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Get my estimate";
    }
  });
}
