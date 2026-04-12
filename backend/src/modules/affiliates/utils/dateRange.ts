export function parseDateRange(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const daysMatch = trimmed.match(/^(\d+)d$/i);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    if (Number.isFinite(days) && days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return { from: since, to: new Date() };
    }
  }
  const parts = trimmed.split(/[,:\s]+/).filter(Boolean);
  if (parts.length >= 1) {
    const from = parts[0] ? new Date(parts[0]) : null;
    const to = parts[1] ? new Date(parts[1]) : null;
    return {
      from: from && !Number.isNaN(from.valueOf()) ? from : null,
      to: to && !Number.isNaN(to.valueOf()) ? to : null,
    };
  }
  return null;
}
