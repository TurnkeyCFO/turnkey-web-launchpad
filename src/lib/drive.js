import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { config, hasDrive } from "../config.js";
import { getDriveClient } from "./google.js";
import { createId, ensureDir, slugify } from "./utils.js";

const localUploadsDir = path.join(config.localDataDir, "uploads");

export async function createLeadFolder(lead) {
  if (!hasDrive) {
    const folderPath = path.join(localUploadsDir, `${lead.leadId}-${slugify(lead.company || lead.email)}`);
    await ensureDir(folderPath);
    return { id: folderPath, url: folderPath };
  }

  const drive = getDriveClient();
  const response = await drive.files.create({
    requestBody: {
      name: `${lead.company || lead.firstName || "Lead"} - ${lead.leadId}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [config.google.driveRootFolderId]
    },
    fields: "id, webViewLink"
  });

  return {
    id: response.data.id,
    url: response.data.webViewLink
  };
}

export async function uploadLeadAssets(folderId, files = []) {
  if (!files.length) {
    return [];
  }

  if (!hasDrive) {
    const target = path.join(localUploadsDir, folderId);
    await ensureDir(target);
    return Promise.all(
      files.map(async (file) => {
        const fileName = `${createId("asset")}-${slugify(file.originalname || file.fieldname || "upload")}`;
        const fullPath = path.join(target, fileName);
        await fs.writeFile(fullPath, file.buffer);
        return { id: fullPath, name: file.originalname, url: fullPath };
      })
    );
  }

  const drive = getDriveClient();
  const uploads = [];
  for (const file of files) {
    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId]
      },
      media: {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer)
      },
      fields: "id, webViewLink, name"
    });

    uploads.push({
      id: response.data.id,
      name: response.data.name,
      url: response.data.webViewLink
    });
  }

  return uploads;
}
