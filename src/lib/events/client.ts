import type { EventFilters, EventPayload, PublishingEvent } from "@/lib/events/types";

async function readJson(response: Response) {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error ?? "Request failed.");
  }

  return json;
}

export async function fetchEvents(filters: EventFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await fetch(`/api/events?${params.toString()}`, {
    cache: "no-store",
  });
  const json = await readJson(response);
  return json.events as PublishingEvent[];
}

export async function createEvent(payload: EventPayload) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.event as PublishingEvent;
}

export async function updateEvent(id: string, payload: Partial<EventPayload>) {
  const response = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(response);
  return json.event as PublishingEvent;
}

export async function deleteEvent(id: string) {
  const response = await fetch(`/api/events/${id}`, {
    method: "DELETE",
  });
  const json = await readJson(response);
  return json.event as PublishingEvent;
}
