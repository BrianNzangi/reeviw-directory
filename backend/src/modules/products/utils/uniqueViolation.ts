export function isUniqueViolation(error: unknown, constraint?: string) {
  const err = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = err?.cause?.code || err?.code;
  if (code !== "23505") return false;
  if (!constraint) return true;
  const name = err?.cause?.constraint || err?.constraint;
  return name === constraint;
}
