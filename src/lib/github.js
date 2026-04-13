import { Buffer } from "node:buffer";
import { Octokit } from "octokit";
import { config, hasGitHub } from "../config.js";
import { slugify } from "./utils.js";

function getClient() {
  if (!hasGitHub) {
    return null;
  }

  return new Octokit({ auth: config.github.token });
}

export async function provisionDraftRepo({ lead, files }) {
  const client = getClient();
  const owner = hasGitHub ? await resolveOwner(client) : "";
  const repoName = `turnkey-web-${slugify(lead.company || `${lead.firstName}-${lead.lastName}` || lead.leadId)}-${lead.leadId.slice(-6)}`;

  if (!hasGitHub) {
    return {
      name: repoName,
      repoUrl: `local://${repoName}`,
      previewUrl: "",
      provider: "local"
    };
  }
  const repoResponse =
    config.github.templateOwner && config.github.templateRepo
      ? await client.request("POST /repos/{template_owner}/{template_repo}/generate", {
          template_owner: config.github.templateOwner,
          template_repo: config.github.templateRepo,
          owner,
          name: repoName,
          private: true,
          include_all_branches: false
        })
      : await client
          .request("POST /orgs/{org}/repos", {
            org: owner,
            name: repoName,
            private: true,
            auto_init: true
          })
          .catch(async () =>
            client.request("POST /user/repos", {
              name: repoName,
              private: true,
              auto_init: true
            })
          );

  const repo = repoResponse.data;

  for (const file of files) {
    await client.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo: repo.name,
      path: file.path,
      message: `Add generated Turnkey Web draft file: ${file.path}`,
      content: Buffer.from(file.content).toString("base64"),
      branch: config.github.defaultBranch,
      committer: {
        name: config.github.committerName,
        email: config.github.committerEmail
      }
    });
  }

  let previewUrl = "";
  let provider = config.preview.provider;
  if (config.preview.provider === "github-pages") {
    previewUrl = await enableGitHubPages(client, owner, repo.name);
  }

  return {
    name: repo.name,
    repoUrl: repo.html_url,
    previewUrl,
    provider
  };
}

async function enableGitHubPages(client, owner, repoName) {
  await client
    .request("POST /repos/{owner}/{repo}/pages", {
      owner,
      repo: repoName,
      source: {
        branch: config.github.pagesBranch,
        path: config.github.pagesPath
      }
    })
    .catch(() => null);

  const page = await client.request("GET /repos/{owner}/{repo}/pages", {
    owner,
    repo: repoName
  });

  return page.data.html_url || "";
}

async function resolveOwner(client) {
  if (config.github.owner) {
    return config.github.owner;
  }

  const currentUser = await client.request("GET /user");
  return currentUser.data.login;
}
