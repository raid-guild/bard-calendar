export type ContentTopic = {
  id: string;
  title: string;
  supporting_material_markdown: string | null;
  status: string;
  publication_status?: "unpublished" | "published";
  publication_at?: string | null;
  publication_evidence_type?: string | null;
  publication_evidence_value?: string | null;
  publication_manual_confirmation?: boolean;
  published_by?: string | null;
  publication_recorded_at?: string | null;
  category_id?: string | null;
  category?: ContentCategory | null;
  tags?: string[];
  editorial_interest_score?: number | null;
  engagement_interest_count?: number;
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
  category_id?: string | null;
  tags?: string[];
  editorial_interest_score?: number | null;
  engagement_interest_count?: number;
};

export type ContentCategory = {
  id: string;
  key: string;
  name: string;
  active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
};

export type TopicAuditEvent = {
  id: string;
  topic_id: string;
  action: string;
  actor: string;
  reason: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  evidence: Record<string, unknown>;
  created_at: string;
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
