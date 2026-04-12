export function pickWeighted<T>(items: T[], weightFn: (item: T) => number) {
  if (items.length === 0) return null;
  const weights = items.map((item) => Math.max(0, weightFn(item)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
