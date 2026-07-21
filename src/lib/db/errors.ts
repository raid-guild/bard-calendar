type ErrorWithPostgresDetails = {
  code?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  cause?: unknown;
};

export function isUniqueConstraintViolation(
  error: unknown,
  expectedConstraint?: string,
): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as ErrorWithPostgresDetails;
  if (candidate.code === "23505") {
    const constraint = candidate.constraint_name ?? candidate.constraint;
    return !expectedConstraint || !constraint || constraint === expectedConstraint;
  }

  return isUniqueConstraintViolation(candidate.cause, expectedConstraint);
}
