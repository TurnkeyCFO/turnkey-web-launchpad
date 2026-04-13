import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const nowIso = () => new Date().toISOString();

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

export const createId = (prefix = "tw") => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex");
  return `${prefix}-${stamp}-${random}`;
};

export const compact = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null && item !== ""));
};

export const safeJsonParse = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const json = (value) => JSON.stringify(value ?? null);

export const textList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

export async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export const withDefault = (value, fallback) => (value === undefined || value === null || value === "" ? fallback : value);

export const addDaysIso = (baseIso, days) => {
  const date = new Date(baseIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const truncate = (value, length = 160) => {
  const source = String(value || "").trim();
  if (source.length <= length) {
    return source;
  }

  return `${source.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
};

export const toBase64Url = (value) => Buffer.from(value).toString("base64url");

export const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

export const groupBy = (items, keyFn) =>
  items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

export const sortBy = (items, keyFn) =>
  [...items].sort((left, right) => {
    const leftValue = keyFn(left);
    const rightValue = keyFn(right);
    if (leftValue < rightValue) {
      return -1;
    }
    if (leftValue > rightValue) {
      return 1;
    }
    return 0;
  });
