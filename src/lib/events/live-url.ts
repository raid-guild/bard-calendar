export function normalizeLiveUrl(value: string) {
  return value.trim();
}

export class LiveUrlConflictError extends Error {
  constructor() {
    super("This live URL is already attached to another publishing event.");
    this.name = "LiveUrlConflictError";
  }
}
