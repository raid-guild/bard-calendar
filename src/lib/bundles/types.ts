export type BundleAuditCheck = {
  key: string;
  label: string;
  status: "pass" | "warning" | "fail" | "not_checked";
  evidence?: string | null;
};

export type ContentBundleRun = {
  id: string;
  topic_id: string;
  status: string;
  stage: string;
  source_system: string;
  source_id: string;
  source_url: string | null;
  source_revision: string | null;
  prism_request_id: string | null;
  requested_channels: string[];
  options: Record<string, unknown>;
  audit_checks: BundleAuditCheck[];
  instructions: string | null;
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentAsset = {
  id: string;
  topic_id: string;
  draft_id: string | null;
  kind: string;
  status: string;
  target_channel: string | null;
  prism_request_id: string;
  prism_artifact_id: string;
  stable_url: string | null;
  mime_type: string | null;
  prompt: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateBundleRunPayload = {
  source: {
    system: "portal-post";
    id: string;
    url?: string | null;
  };
  channels: string[];
  options?: {
    audit?: boolean;
    generate_images?: boolean;
  };
  instructions?: string | null;
};

export type TopicBundle = {
  topic: import("@/lib/content/types").ContentTopic;
  drafts: import("@/lib/content/types").ContentDraft[];
  runs: ContentBundleRun[];
  assets: ContentAsset[];
  latest_run: ContentBundleRun | null;
};
