import { createHash, randomUUID } from "crypto";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function maskSecret(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const tail = trimmed.slice(-4);
  return `****${tail}`;
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function safeRandomExternalId(prefix = "manual") {
  return `${prefix}-${randomUUID()}`;
}

export function normalizeExternalId(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!/[eE]/.test(raw)) return raw;
  return expandScientificNotation(raw) ?? raw;
}

function expandScientificNotation(value: string) {
  const match = value.match(/^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
  if (!match) return null;
  const [, sign, intPart, fracPart = "", expRaw] = match;
  const exponent = Number(expRaw);
  if (!Number.isFinite(exponent)) return null;

  const digits = `${intPart}${fracPart}`;
  if (digits.length === 0) return null;

  if (exponent >= 0) {
    if (exponent >= fracPart.length) {
      const zeros = "0".repeat(exponent - fracPart.length);
      return `${sign}${digits}${zeros}`;
    }
    const decimalIndex = intPart.length + exponent;
    return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  }

  const absExp = Math.abs(exponent);
  const zeros = "0".repeat(Math.max(0, absExp - intPart.length));
  const prefix = `${sign}0.${zeros}`;
  const shiftedIndex = intPart.length - absExp;
  if (shiftedIndex > 0) {
    return `${sign}${digits.slice(0, shiftedIndex)}.${digits.slice(shiftedIndex)}`;
  }
  return `${prefix}${digits}`;
}
