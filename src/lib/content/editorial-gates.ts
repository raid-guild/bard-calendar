import type { ContentDraft } from "@/lib/content/types";

const alwaysRequired = ["research", "writing", "brand_voice", "public_output_safety"];

export type EditorialGateResult = { allowed: boolean; blockers: string[] };

export function evaluateEditorialGates(draft: ContentDraft): EditorialGateResult {
  const checks = Array.isArray(draft.audit_checks) ? draft.audit_checks as Array<{ key?: string; status?: string }> : [];
  const route = draft.route;
  const requiresSeo = route?.platform === "website" || route?.format === "article";
  const required = requiresSeo ? [...alwaysRequired, "seo_aeo"] : alwaysRequired;
  const blockers = required.filter((key) => !checks.some((check) => check.key === key && check.status === "pass"));
  if (draft.editorial_status !== "approved") blockers.unshift("editorial_approval");
  return { allowed: blockers.length === 0, blockers };
}

export class EditorialGateError extends Error {
  status = 409;
  code = "EDITORIAL_GATES_INCOMPLETE";
  constructor(public blockers: string[]) { super(`Scheduling blocked by required editorial gates: ${blockers.join(", ")}.`); }
}
