import { config } from "./config.js";
import { bootstrapSocialAgent, runSocialAgentCycle } from "./lib/social-agent.js";
import { bootstrapApp, processQueuedDrafts } from "./lib/workflow.js";

async function cycle() {
  const results = await processQueuedDrafts({ limit: 2 });
  const social = await runSocialAgentCycle();
  if (results.length) {
    console.log("Processed draft jobs", results);
  }
  if (social.publishResults.length || social.monitorResults.snapshots.length) {
    console.log("Processed social jobs", social);
  }
}

async function start() {
  await bootstrapApp();
  await bootstrapSocialAgent();
  await cycle();
  setInterval(() => {
    cycle().catch((error) => {
      console.error("Worker cycle failed", error);
    });
  }, config.workerPollMs);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
