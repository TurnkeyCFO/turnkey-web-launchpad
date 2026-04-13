function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

  const reviewCount = result.leads.filter((lead) => lead.stage === "internal_review").length;
  const approvalCount = result.emails.filter((email) => ["awaiting_approval", "approved"].includes(email.status)).length;
  const approvedCount = result.emails.filter((email) => email.status === "approved").length;
  const previewCount = result.projects.filter((project) => project.previewUrl).length;
  const pipelineValue = result.leads.reduce((total, lead) => total + ((Number(lead.estimateLow || 0) + Number(lead.estimateHigh || 0)) / 2), 0);

  document.getElementById("review-count").textContent = reviewCount;
  document.getElementById("approval-count").textContent = approvalCount;
  document.getElementById("approved-count").textContent = approvedCount;
  document.getElementById("preview-count").textContent = previewCount;
  document.getElementById("pipeline-value").textContent = currency(pipelineValue);

  const projectByLead = Object.fromEntries(result.projects.map((project) => [project.leadId, project]));
  const rows = result.leads
    .map((lead) => {
      const project = projectByLead[lead.leadId] || {};
      const leadName = escapeHtml(lead.company || `${lead.firstName} ${lead.lastName}`);
      const email = escapeHtml(lead.email);
      const stage = escapeHtml(lead.stage);
      const packageName = escapeHtml(lead.recommendedPackage || "Pending");
      const preview = project.previewUrl
        ? `<a href="${escapeHtml(project.previewUrl)}" target="_blank" rel="noreferrer">Open preview</a>`
        : "Pending";

      return `<tr>
        <td data-label="Lead"><strong>${leadName}</strong><br><span class="muted">${email}</span></td>
        <td data-label="Stage">${stage}</td>
        <td data-label="Package">${packageName}</td>
        <td data-label="Estimate">${currency(lead.estimateLow)} - ${currency(lead.estimateHigh)}</td>
        <td data-label="Preview">${preview}</td>
      </tr>`;
    })
    .join("");

  document.getElementById("lead-table").innerHTML = rows || `<tr><td colspan="5">No leads yet.</td></tr>`;

  const stageCounts = result.leads.reduce((counts, lead) => {
    counts[lead.stage] = (counts[lead.stage] || 0) + 1;
    return counts;
  }, {});

  const pipelineBreakdown = Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([stage, count]) => `<li><span class="dot"></span><span><strong>${escapeHtml(stage.replaceAll("_", " "))}</strong> - ${count}</span></li>`)
    .join("");

  document.getElementById("pipeline-breakdown").innerHTML =
    pipelineBreakdown || `<li><span class="dot"></span><span>No lead stages recorded yet.</span></li>`;

  const opsSummary = [
    `${result.projects.filter((project) => project.draftStatus === "queued").length} project(s) queued for draft generation.`,
    `${result.projects.filter((project) => project.draftStatus === "internal_review").length} draft(s) in internal review.`,
    `${result.emails.filter((email) => email.status === "sent").length} email record(s) already sent.`
  ]
    .map((line) => `<li><span class="dot navy"></span><span>${escapeHtml(line)}</span></li>`)
    .join("");

  document.getElementById("ops-summary").innerHTML = opsSummary;
}

loadDashboard().catch((error) => {
  document.getElementById("lead-table").innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
});
