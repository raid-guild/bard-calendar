import type { ContentCategory, ContentDraft, ContentTopic, DraftPayload, TopicPayload } from "@/lib/content/types";
import type { EventPayload, PublishingEvent } from "@/lib/events/types";

async function readJson(response: Response) {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error ?? "Request failed.");
  }

  return json;
}

export async function fetchTopics() {
  const response = await fetch("/api/topics", { cache: "no-store" });
  const json = await readJson(response);
  return json.topics as ContentTopic[];
}

export async function fetchTopic(id: string) {
  const response = await fetch(`/api/topics/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const json = await readJson(response);
  return json.topic as ContentTopic;
}

export async function createTopic(payload: TopicPayload) {
  const response = await fetch("/api/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.topic as ContentTopic;
}

export async function updateTopic(id: string, payload: Partial<TopicPayload>) {
  const response = await fetch(`/api/topics/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.topic as ContentTopic;
}

export async function fetchCategories() {
  const json = await readJson(await fetch("/api/categories", { cache: "no-store" }));
  return json.categories as ContentCategory[];
}

export async function publishTopic(id: string, payload: { publication_at: string; evidence_type: "live_url" | "external_post_id" | "manual_confirmation"; evidence_value?: string | null; manual_confirmation: boolean }) {
  const json = await readJson(await fetch(`/api/topics/${id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
  return json.topic as ContentTopic;
}

export async function reopenTopic(id: string, reason: string) {
  const json = await readJson(await fetch(`/api/topics/${id}/reopen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) }));
  return json.topic as ContentTopic;
}

export async function fetchDrafts(filters: { topic_id?: string } = {}) {
  const params = new URLSearchParams();

  if (filters.topic_id) {
    params.set("topic_id", filters.topic_id);
  }

  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetch(`/api/drafts${query}`, { cache: "no-store" });
  const json = await readJson(response);
  return json.drafts as ContentDraft[];
}

export async function createDraft(payload: DraftPayload) {
  const response = await fetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.draft as ContentDraft;
}

export async function updateDraft(id: string, payload: Partial<DraftPayload>) {
  const response = await fetch(`/api/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.draft as ContentDraft;
}

export async function toggleDraftDagger(draft: ContentDraft) {
  const response = await fetch(`/api/drafts/${draft.id}/daggers`, {
    method: draft.user_has_dagger ? "DELETE" : "POST",
  });
  const json = await readJson(response);
  return json.draft as ContentDraft;
}

export async function assignDraftToEvent(
  id: string,
  payload: Pick<EventPayload, "publish_at" | "status"> &
    Partial<Pick<EventPayload, "name" | "content_type" | "campaign" | "owner" | "media_url" | "live_url" | "notes" | "metadata">>,
) {
  const response = await fetch(`/api/drafts/${id}/assign-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.event as PublishingEvent;
}
