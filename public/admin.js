function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

async function loadDashboard() {
  const response = await fetch("/api/admin/overview");
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "Failed to load dashboard");
  }

  document.getElementById("lead-count").textContent = result.leads.length;
  document.getElementById("draft-count").textContent = result.projects.length;
  document.getElementById("email-count").textContent = result.emails.length;

  const projectByLead = Object.fromEntries(result.projects.map((project) => [project.leadId, project]));
  const rows = result.leads
    .map((lead) => {
      const project = projectByLead[lead.leadId] || {};
      return `<tr>
        <td><strong>${lead.company || `${lead.firstName} ${lead.lastName}`}</strong><br><span class="muted">${lead.email}</span></td>
        <td>${lead.stage}</td>
        <td>${lead.recommendedPackage || "Pending"}</td>
        <td>${currency(lead.estimateLow)} - ${currency(lead.estimateHigh)}</td>
        <td>${project.previewUrl ? `<a href="${project.previewUrl}" target="_blank" rel="noreferrer">Open preview</a>` : "Pending"}</td>
      </tr>`;
    })
    .join("");

  document.getElementById("lead-table").innerHTML = rows || `<tr><td colspan="5">No leads yet.</td></tr>`;
}

loadDashboard().catch((error) => {
  document.getElementById("lead-table").innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
});
