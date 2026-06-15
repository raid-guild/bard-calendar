export type ContentTopic = {
  id: string;
  title: string;
  supporting_material_markdown: string | null;
  status: string;
  created_by: string | null;
  metadata: Record<string, unknown>;
  external_source: string | null;
  external_id: string | null;
  draft_count: number;
  created_at: string;
  updated_at: string;
};

export type ContentDraft = {
  id: string;
  topic_id: string;
  title: string;
  target_channel: string;
  markdown_content: string;
  external_draft_url: string | null;
  status: string;
  created_by: string | null;
  metadata: Record<string, unknown>;
  external_source: string | null;
  external_id: string | null;
  dagger_count: number;
  user_has_dagger: boolean;
  assigned_event_id: string | null;
  assigned_publish_at: string | null;
  live_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TopicPayload = {
  title: string;
  supporting_material_markdown?: string | null;
  status?: string;
  created_by?: string | null;
  metadata?: Record<string, unknown>;
};

export type DraftPayload = {
  topic_id: string;
  title: string;
  target_channel: string;
  markdown_content?: string;
  external_draft_url?: string | null;
  status?: string;
  created_by?: string | null;
  metadata?: Record<string, unknown>;
};
