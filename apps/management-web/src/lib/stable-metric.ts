export function stableMetric(seed: string, offset = 0, min = 55, range = 43) {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), offset);
  return min + (total % range);
}
