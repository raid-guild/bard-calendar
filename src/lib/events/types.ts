export type PublishingEvent = {
  id: string;
  name: string;
  publish_at: string;
  target_channel: string;
  status: string;
  content_type: string | null;
  campaign: string | null;
  owner: string | null;
  draft_url: string | null;
  media_url: string | null;
  live_url: string | null;
  topic_id: string | null;
  draft_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  external_source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EventPayload = {
  name: string;
  publish_at: string;
  target_channel: string;
  status: string;
  content_type?: string | null;
  campaign?: string | null;
  owner?: string | null;
  draft_url?: string | null;
  media_url?: string | null;
  live_url?: string | null;
  topic_id?: string | null;
  draft_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type EventFilters = {
  start?: string;
  end?: string;
  target_channel?: string;
  status?: string;
  owner?: string;
  name?: string;
  search?: string;
  topic_id?: string;
  draft_id?: string;
};
