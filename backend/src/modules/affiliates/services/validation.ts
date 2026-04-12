export function isUniqueViolation(error: unknown, constraint?: string) {
  const err = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const code = err?.cause?.code || err?.code;
  if (code !== "23505") return false;
  if (!constraint) return true;
  const name = err?.cause?.constraint || err?.constraint;
  return name === constraint;
}

export function getDatabaseErrorMessage(error: unknown) {
  const err = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = err?.cause?.code || err?.code;
  if (code === "42703") {
    return "Database schema is out of date. Run migrations and try again.";
  }
  return err?.cause?.message || err?.message || "Database error";
}

export function isDatabaseColumnMissing(error: unknown) {
  const err = error as { code?: string; cause?: { code?: string } };
  const code = err?.cause?.code || err?.code;
  return code === "42703";
}
