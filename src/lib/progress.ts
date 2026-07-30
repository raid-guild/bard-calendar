export function normalizeProgress(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}
