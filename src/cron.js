import { bootstrapSocialAgent, runSocialAgentCycle } from "./lib/social-agent.js";
import { bootstrapApp, processDueEmails } from "./lib/workflow.js";

async function run() {
  await bootstrapApp();
  await bootstrapSocialAgent();
  const sent = await processDueEmails();
  const social = await runSocialAgentCycle();
  console.log(`Processed ${sent.length} due emails`);
  console.log(`Processed ${social.publishResults.length} social publish actions and ${social.monitorResults.snapshots.length} monitoring snapshots`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
