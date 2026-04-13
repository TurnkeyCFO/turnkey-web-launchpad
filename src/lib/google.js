import { google } from "googleapis";
import { config, hasDrive, hasGmail, hasGoogleSheets } from "../config.js";

let serviceAccountCache = null;
let gmailOAuthCache = null;

function parseServiceAccount() {
  if (!config.google.serviceAccountJson) {
    return null;
  }

  if (!serviceAccountCache) {
    serviceAccountCache = JSON.parse(config.google.serviceAccountJson);
  }

  return serviceAccountCache;
}

export function getSheetsClient() {
  if (!hasGoogleSheets) {
    return null;
  }

  const credentials = parseServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

export function getDriveClient() {
  if (!hasDrive) {
    return null;
  }

  const credentials = parseServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });

  return google.drive({ version: "v3", auth });
}

export function getGmailClient() {
  if (!hasGmail) {
    return null;
  }

  if (!gmailOAuthCache) {
    gmailOAuthCache = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret);
    gmailOAuthCache.setCredentials({ refresh_token: config.google.refreshToken });
  }

  return google.gmail({ version: "v1", auth: gmailOAuthCache });
}
