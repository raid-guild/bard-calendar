import { isUniqueConstraintViolation } from "@/lib/db/errors";
import { createBundleRun, getBundleRunByIdempotencyKey, updateBundleRun } from "@/lib/bundles/queries";
import { PrismBundleError, triggerPrismBundle } from "@/lib/bundles/prism-client";
import type { CreateBundleRunInput } from "@/lib/bundles/validation";
import { getTopic, getTopicByExternalIdentity, updateTopic } from "@/lib/content/queries";

export class BundleOrchestrationError extends Error {
  constructor(message: string, public status: number, public code: string, public details?: unknown) { super(message); }
}

export async function createAndDispatchBundleRun(topicId: string, input: CreateBundleRunInput, createdBy?: string | null) {
  const topic = await getTopic(topicId);
  if (!topic) throw new BundleOrchestrationError("Topic not found.", 404, "TOPIC_NOT_FOUND");

  if (input.idempotency_key) {
    const existing = await getBundleRunByIdempotencyKey(topicId, input.idempotency_key);
    if (existing) return { run: existing, prism: existing.prism_request_id ? { requestId: existing.prism_request_id } : null, replayed: true };
  }

  const linked = await getTopicByExternalIdentity(input.source.system, input.source.id);
  if (linked && linked.id !== topic.id) throw new BundleOrchestrationError("This Portal post is already linked to another Topic.", 409, "SOURCE_CONFLICT", { topic_id: linked.id });

  let updatedTopic = topic;
  try {
    updatedTopic = (await updateTopic(topic.id, { external_source: input.source.system, external_id: input.source.id, metadata: { ...topic.metadata, portal_post_id: input.source.id, ...(input.source.url ? { portal_post_url: input.source.url } : {}) } })) ?? topic;
  } catch (error) {
    if (!isUniqueConstraintViolation(error, "content_topics_external_identity_idx")) throw error;
    throw new BundleOrchestrationError("This Portal post is already linked to another Topic.", 409, "SOURCE_CONFLICT");
  }

  let run;
  try { run = await createBundleRun(topic.id, input, createdBy); }
  catch (error) {
    if (!input.idempotency_key || !isUniqueConstraintViolation(error, "content_bundle_runs_idempotency_idx")) throw error;
    const existing = await getBundleRunByIdempotencyKey(topic.id, input.idempotency_key);
    if (!existing) throw error;
    return { run: existing, prism: existing.prism_request_id ? { requestId: existing.prism_request_id } : null, replayed: true };
  }

  try {
    const prism = await triggerPrismBundle(updatedTopic, run, input);
    const dispatched = await updateBundleRun(run.id, { prism_request_id: prism.requestId, error_message: null });
    return { run: dispatched, prism, replayed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not trigger Prism.";
    const failed = await updateBundleRun(run.id, { status: "failed", stage: "dispatch", error_message: message, finished_at: new Date().toISOString() });
    throw new BundleOrchestrationError(message, error instanceof PrismBundleError ? error.status : 502, error instanceof PrismBundleError ? error.code : "PRISM_DISPATCH_FAILED", { run: failed });
  }
}
