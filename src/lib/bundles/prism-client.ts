import type { CreateBundleRunInput } from "@/lib/bundles/validation";
import type { ContentBundleRun } from "@/lib/bundles/types";
import type { ContentTopic } from "@/lib/content/types";

type PrismHookResponse = {
  ok?: unknown;
  error?: unknown;
  changeRequest?: { id?: unknown; requestNumber?: unknown };
};

export class PrismBundleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function prismConfiguration() {
  const baseUrl = process.env.PRISM_AGENT_API_BASE_URL?.trim();
  const serviceToken = process.env.PRISM_AGENT_SERVICE_TOKEN?.trim();
  const hookKey =
    process.env.PRISM_CONTENT_BUNDLE_HOOK_KEY?.trim() ||
    "content-distribution-bundle";

  if (!baseUrl || !serviceToken) {
    throw new PrismBundleError(
      "Prism content bundle generation is not configured.",
      "PRISM_NOT_CONFIGURED",
      503,
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceToken, hookKey };
}

export async function triggerPrismBundle(
  topic: ContentTopic,
  run: ContentBundleRun,
  input: CreateBundleRunInput,
) {
  const { baseUrl, serviceToken, hookKey } = prismConfiguration();
  const response = await fetch(
    `${baseUrl}/agent/hooks/${encodeURIComponent(hookKey)}/trigger`,
    {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "content-type": "application/json",
        "x-service-token": serviceToken,
      },
      body: JSON.stringify({
        title: topic.title,
        topic_id: topic.id,
        bundle_run_id: run.id,
        source: input.source,
        channels: input.channels,
        options: input.options,
        instructions: input.instructions,
        bard: {
          topic_id: topic.id,
          bundle_run_id: run.id,
          api_base_url: process.env.APP_BASE_URL ?? null,
        },
      }),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as PrismHookResponse;

  if (!response.ok || payload.ok === false) {
    const upstreamError =
      typeof payload.error === "string" ? payload.error : "Prism hook failed.";
    throw new PrismBundleError(
      upstreamError,
      "PRISM_HOOK_FAILED",
      response.status === 409 || response.status === 429 || response.status >= 500
        ? 503
        : 502,
    );
  }

  const requestId = payload.changeRequest?.id;

  if (typeof requestId !== "string" || !requestId) {
    throw new PrismBundleError(
      "Prism accepted the hook but did not return a request identifier.",
      "PRISM_REQUEST_ID_MISSING",
      502,
    );
  }

  return {
    requestId,
    requestNumber:
      typeof payload.changeRequest?.requestNumber === "number"
        ? payload.changeRequest.requestNumber
        : null,
  };
}
