import type {
  ContentBundleRun,
  CreateBundleRunPayload,
  TopicBundle,
} from "@/lib/bundles/types";

async function readJson(response: Response) {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error ?? "Request failed.");
  }

  return json;
}

export async function fetchTopicBundle(topicId: string) {
  const response = await fetch(
    `/api/topics/${encodeURIComponent(topicId)}/bundle`,
    { cache: "no-store" },
  );
  const json = await readJson(response);
  return json.bundle as TopicBundle;
}

export async function createTopicBundleRun(
  topicId: string,
  payload: CreateBundleRunPayload,
) {
  const response = await fetch(
    `/api/topics/${encodeURIComponent(topicId)}/bundle-runs`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const json = await readJson(response);
  return json.run as ContentBundleRun;
}

export async function fetchBundleRun(id: string) {
  const response = await fetch(`/api/bundle-runs/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const json = await readJson(response);
  return json.run as ContentBundleRun;
}
