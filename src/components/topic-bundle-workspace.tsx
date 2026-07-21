"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  ImageIcon,
  Layers3,
  Link2,
  LoaderCircle,
  PanelTopOpen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ChannelBadge } from "@/components/channel-badge";
import { PortalLaunchRequired } from "@/components/portal-launch-required";
import { StatusBadge } from "@/components/status-badge";
import { TopBar } from "@/components/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createTopicBundleRun,
  fetchTopicBundle,
} from "@/lib/bundles/client";
import type {
  ContentAsset,
  CreateBundleRunPayload,
} from "@/lib/bundles/types";
import {
  bundleAuditChecks,
  bundleSource,
  type AuditCheck,
} from "@/lib/content/bundle-metadata";
import { toggleDraftDagger } from "@/lib/content/client";
import type { ContentDraft } from "@/lib/content/types";
import { formatDateTime, parseIsoDate } from "@/lib/dates";
import { targetChannels } from "@/lib/events/constants";
import { fetchPortalSession } from "@/lib/session/client";
import { cn } from "@/lib/utils";

const defaultChannels = ["x: main account", "linkedin", "discord"];

const runProgress: Record<string, number> = {
  queued: 8,
  fetching: 20,
  auditing: 38,
  generating_copy: 58,
  generating_images: 74,
  syncing: 90,
  complete: 100,
};

const auditStyles: Record<AuditCheck["status"], string> = {
  pass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  fail: "border-destructive/40 bg-destructive/10 text-destructive",
  not_checked: "border-border bg-muted/40 text-muted-foreground",
};

function readableStage(value: string) {
  return value.replaceAll("_", " ");
}

function displayDateTime(value: string) {
  return parseIsoDate(value) ? formatDateTime(value) : "Unknown date";
}

function generatedAt(draft: ContentDraft) {
  const value = draft.metadata.generated_at;
  return typeof value === "string" ? value : null;
}

function sourceRevision(draft: ContentDraft) {
  const value = draft.metadata.source_revision;
  return typeof value === "string" ? value : null;
}

function DraftCard({
  draft,
  canEdit,
  currentSourceRevision,
  onToggleDagger,
  onRegenerate,
}: {
  draft: ContentDraft;
  canEdit: boolean;
  currentSourceRevision: string | null;
  onToggleDagger: (draft: ContentDraft) => Promise<void>;
  onRegenerate: (draft: ContentDraft) => void;
}) {
  const generated = generatedAt(draft);
  const draftRevision = sourceRevision(draft);
  const stale = Boolean(
    currentSourceRevision &&
      draftRevision &&
      currentSourceRevision !== draftRevision,
  );

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft.markdown_content);
    toast.success("Draft copied.");
  };

  return (
    <article className="flex min-h-[290px] flex-col border border-border bg-card/55">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={draft.target_channel} />
            <StatusBadge status={draft.status} />
            {generated ? (
              <Badge
                variant="outline"
                className="rounded-sm border-primary/30 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.12em] text-primary"
              >
                Generated
              </Badge>
            ) : null}
          </div>
          <h2 className="font-heading text-lg font-medium">{draft.title}</h2>
        </div>
        <Button
          variant={draft.user_has_dagger ? "default" : "outline"}
          size="sm"
          className="rounded-sm"
          disabled={!canEdit}
          onClick={() => onToggleDagger(draft)}
        >
          <span aria-hidden>🗡️</span>
          {draft.dagger_count}
        </Button>
      </div>

      {stale ? (
        <div className="flex items-center gap-2 border-b border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs text-amber-200">
          <CircleAlert className="h-4 w-4" />
          Source changed after this Draft was generated.
        </div>
      ) : null}

      <div className="min-h-0 flex-1 px-4 py-4">
        {draft.markdown_content ? (
          <div className="max-h-40 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-foreground/85 [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
            {draft.markdown_content}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
            No copy yet.
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {draft.markdown_content ? (
            <span>{draft.markdown_content.length} characters</span>
          ) : null}
          {generated ? <span>{displayDateTime(generated)}</span> : null}
          {draft.assigned_publish_at ? (
            <span>Publishes {displayDateTime(draft.assigned_publish_at)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            disabled={!draft.markdown_content}
            onClick={copyDraft}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm" asChild>
            <Link
              href={`/?tab=drafts&topic=${encodeURIComponent(draft.topic_id)}&draft=${encodeURIComponent(draft.id)}`}
            >
              <PanelTopOpen className="h-4 w-4" />
              {canEdit ? "Edit" : "Open"}
            </Link>
          </Button>
          {draft.external_draft_url ? (
            <Button variant="ghost" size="sm" className="rounded-sm" asChild>
              <a href={draft.external_draft_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                External
              </a>
            </Button>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-sm"
                disabled={!canEdit}
                aria-label={`Regenerate only the ${draft.target_channel} Draft`}
                onClick={() => onRegenerate(draft)}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              Starts a new Prism run for only this channel. Human edits are
              preserved instead of overwritten.
            </TooltipContent>
          </Tooltip>
          {!draft.assigned_event_id ? (
            <Button variant="ghost" size="sm" className="rounded-sm" asChild>
              <Link
                href={`/?tab=drafts&topic=${encodeURIComponent(draft.topic_id)}&assign=${encodeURIComponent(draft.id)}`}
              >
                <CalendarPlus className="h-4 w-4" />
                Schedule
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AssetCard({ asset }: { asset: ContentAsset }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = `/api/content-assets/${encodeURIComponent(asset.id)}/content`;
  const isImage =
    asset.mime_type?.toLowerCase().startsWith("image/") === true ||
    asset.kind.toLowerCase().includes("image");
  const metadataAlt = asset.metadata.alt_text ?? asset.metadata.alt;
  const alt =
    typeof metadataAlt === "string" && metadataAlt.trim()
      ? metadataAlt
      : `${asset.target_channel ?? "Generated"} ${asset.kind}`;

  return (
    <article className="border border-border bg-background/35">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-border bg-muted/25">
        {isImage && !previewFailed ? (
          <Image
            src={previewUrl}
            alt={alt}
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-xs text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            {previewFailed ? <span>Preview unavailable</span> : null}
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-sm text-[10px]">
            {asset.kind}
          </Badge>
          {asset.target_channel ? (
            <ChannelBadge channel={asset.target_channel} />
          ) : null}
        </div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">
          {asset.prism_artifact_id}
        </div>
        <Button variant="outline" size="sm" className="w-full rounded-sm" asChild>
          <a
            href={asset.stable_url ?? previewUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            {asset.stable_url ? "Open asset" : "Open full size"}
          </a>
        </Button>
      </div>
    </article>
  );
}

function GenerationDialog({
  open,
  onOpenChange,
  sourceId,
  sourceUrl,
  existingChannels,
  regenerationChannel,
  pending,
  onStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string | null;
  sourceUrl: string | null;
  existingChannels: string[];
  regenerationChannel: string | null;
  pending: boolean;
  onStart: (payload: CreateBundleRunPayload) => Promise<void>;
}) {
  const [postId, setPostId] = useState(sourceId ?? "");
  const [postUrl, setPostUrl] = useState(sourceUrl ?? "");
  const [channels, setChannels] = useState<string[]>(
    existingChannels.length ? existingChannels : defaultChannels,
  );
  const [instructions, setInstructions] = useState("");
  const [runAudit, setRunAudit] = useState(true);
  const [generateImages, setGenerateImages] = useState(true);
  const existingChannelKey = existingChannels.join("\u0000");

  useEffect(() => {
    if (!open) {
      return;
    }

    setPostId(sourceId ?? "");
    setPostUrl(sourceUrl ?? "");
    setChannels(
      existingChannelKey ? existingChannelKey.split("\u0000") : defaultChannels,
    );
    setInstructions("");
    setRunAudit(true);
    setGenerateImages(true);
  }, [existingChannelKey, open, sourceId, sourceUrl]);

  const start = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onStart({
      source: {
        system: "portal-post",
        id: postId.trim(),
        url: postUrl.trim() || null,
      },
      channels,
      options: {
        audit: runAudit,
        generate_images: generateImages,
      },
      instructions: instructions.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-sm border-border">
        <DialogHeader>
          <DialogTitle>
            {regenerationChannel
              ? `Regenerate ${regenerationChannel} Draft`
              : "Generate distribution bundle"}
          </DialogTitle>
          <DialogDescription>
            {regenerationChannel
              ? "This starts a new Prism run for the selected channel. Existing human edits will not be overwritten."
              : "Bard will ask Prism to audit the Portal post and create Drafts for the selected channels."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5 py-2" onSubmit={start}>
          <div className="border border-primary/25 bg-primary/5 px-3 py-2 text-sm leading-6 text-foreground/85">
            Only the Portal post ID is required. The URL is optional and only
            adds a convenient source link in Bard.
          </div>
          <div className="grid gap-2">
            <Label htmlFor="portal-post-reference">
              Portal post ID <span className="text-primary">(required)</span>
            </Label>
            <Input
              id="portal-post-reference"
              value={postId}
              onChange={(event) => setPostId(event.target.value)}
              placeholder="e.g. 72"
              required
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Find this number in the Portal post record or URL. A searchable
              title selector is planned.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="portal-post-url">
              Portal post URL{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="portal-post-url"
              type="url"
              value={postUrl}
              onChange={(event) => setPostUrl(event.target.value)}
              placeholder="https://portal.raidguild.org/posts/..."
            />
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Target channels</legend>
            {regenerationChannel ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Per-Draft regeneration is limited to {regenerationChannel}. Use
                Regenerate bundle to run several channels together.
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {targetChannels.map((channel) => (
                <label
                  key={channel}
                  className={cn(
                    "flex items-center gap-3 border border-border bg-card/40 px-3 py-2 text-sm",
                    regenerationChannel &&
                      channel !== regenerationChannel &&
                      "opacity-45",
                  )}
                >
                  <Checkbox
                    checked={channels.includes(channel)}
                    disabled={Boolean(regenerationChannel)}
                    onCheckedChange={(checked) =>
                      setChannels((current) =>
                        checked
                          ? Array.from(new Set([...current, channel]))
                          : current.filter((value) => value !== channel),
                      )
                    }
                  />
                  {channel}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="bundle-instructions">Bundle instructions</Label>
            <Textarea
              id="bundle-instructions"
              placeholder="Optional emphasis, audience, campaign, or tone guidance."
              className="min-h-24"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-3 border border-border bg-card/40 px-3 py-3 text-sm">
              <Checkbox
                checked={runAudit}
                onCheckedChange={(value) => setRunAudit(value === true)}
              />
              Run content audit
            </label>
            <label className="flex items-center gap-3 border border-border bg-card/40 px-3 py-3 text-sm">
              <Checkbox
                checked={generateImages}
                onCheckedChange={(value) => setGenerateImages(value === true)}
              />
              Generate images
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={pending || !postId.trim() || !channels.length}
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {pending
                ? "Starting"
                : regenerationChannel
                  ? "Start regeneration"
                  : "Start generation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TopicBundleWorkspace({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generationChannels, setGenerationChannels] = useState<string[] | null>(
    null,
  );

  const sessionQuery = useQuery({
    queryKey: ["portal-session"],
    queryFn: fetchPortalSession,
    retry: false,
  });
  const canView = sessionQuery.data?.canView === true;
  const canEdit = sessionQuery.data?.canEdit === true;

  const bundleQuery = useQuery({
    queryKey: ["topic-bundle", topicId],
    queryFn: () => fetchTopicBundle(topicId),
    enabled: canView,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.latest_run?.status;
      return status &&
        !["complete", "partial", "failed", "canceled"].includes(status)
        ? 2_500
        : false;
    },
  });

  const daggerMutation = useMutation({
    mutationFn: toggleDraftDagger,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["topic-bundle", topicId] }),
        queryClient.invalidateQueries({ queryKey: ["drafts"] }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const createRunMutation = useMutation({
    mutationFn: (payload: CreateBundleRunPayload) =>
      createTopicBundleRun(topicId, payload),
    onSuccess: () => {
      setGenerationOpen(false);
      setGenerationChannels(null);
      toast.success("Bundle generation queued.");
    },
    onError: (error) => toast.error(error.message),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["topic-bundle", topicId],
      });
    },
  });

  if (sessionQuery.isLoading) {
    return <BundleLoading />;
  }

  if (sessionQuery.isError) {
    return (
      <PortalLaunchRequired
        title="Portal session unavailable"
        message="We could not verify your RaidGuild Portal session. Please return to the Portal and open the calendar again."
        portalModulesUrl="https://portal.raidguild.org/modules"
      />
    );
  }

  if (!canView) {
    return (
      <PortalLaunchRequired
        title="Content bundle access unavailable"
        message="This workspace needs to be opened through an authorized RaidGuild Portal session."
        portalModulesUrl={
          sessionQuery.data?.portalModulesUrl ??
          "https://portal.raidguild.org/modules"
        }
      />
    );
  }

  if (bundleQuery.isLoading) {
    return <BundleLoading />;
  }

  if (bundleQuery.isError || !bundleQuery.data) {
    return (
      <div className="noise-bg relative min-h-screen bg-background text-foreground">
        <TopBar rangeLabel="Content bundle" />
        <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-10 lg:px-6">
          <div className="border border-destructive/40 bg-destructive/10 p-6">
            <h1 className="font-heading text-2xl">Topic unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {bundleQuery.error?.message ?? "The Topic could not be loaded."}
            </p>
            <Button variant="outline" className="mt-5 rounded-sm" asChild>
              <Link href="/?tab=drafts">
                <ArrowLeft className="h-4 w-4" />
                Back to Drafts
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const bundle = bundleQuery.data;
  const topic = bundle.topic;
  const drafts = bundle.drafts;
  const source = bundleSource(topic);
  const run = bundle.latest_run;
  const currentSourceRevision = source.revision ?? run?.source_revision ?? null;
  const auditChecks = run?.audit_checks.length
    ? run.audit_checks
    : bundleAuditChecks(topic);
  const assets = bundle.assets;
  const readyDrafts = drafts.filter((draft) =>
    ["ready", "assigned", "published"].includes(draft.status),
  ).length;
  const existingChannels = Array.from(
    new Set(drafts.map((draft) => draft.target_channel)),
  );

  return (
    <div className="noise-bg relative min-h-screen bg-background text-foreground">
      <TopBar rangeLabel="Content bundle" />
      <main className="relative z-10 mx-auto grid max-w-[1600px] gap-5 px-4 py-5 lg:px-6">
        <div>
          <Button variant="ghost" size="sm" className="rounded-sm" asChild>
            <Link href={`/?tab=drafts&topic=${encodeURIComponent(topic.id)}`}>
              <ArrowLeft className="h-4 w-4" />
              Drafts
            </Link>
          </Button>
        </div>

        <section className="border border-border bg-card/60">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-sm border-border font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Topic
                </Badge>
                <StatusBadge status={topic.status} />
                {source.id ? (
                  <Badge
                    variant="outline"
                    className="rounded-sm border-primary/30 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.14em] text-primary"
                  >
                    Portal post {source.id}
                  </Badge>
                ) : null}
              </div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight lg:text-4xl">
                {topic.title}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <span>
                  {readyDrafts} of {drafts.length} Drafts ready
                </span>
                <span>Updated {displayDateTime(topic.updated_at)}</span>
                {source.updatedAt ? (
                  <span>Source updated {displayDateTime(source.updatedAt)}</span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {source.url ? (
                <Button variant="outline" className="rounded-sm" asChild>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Portal source
                  </a>
                </Button>
              ) : null}
              <Button
                className="rounded-sm"
                disabled={!canEdit}
                onClick={() => {
                  setGenerationChannels(null);
                  setGenerationOpen(true);
                }}
              >
                <Sparkles className="h-4 w-4" />
                {run ? "Regenerate bundle" : "Generate bundle"}
              </Button>
            </div>
          </div>

          {run ? (
            <div
              className={cn(
                "border-t border-border px-5 py-4",
                run.status === "failed" &&
                  "border-destructive/30 bg-destructive/10",
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  {run.status === "complete" ? (
                    <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
                  ) : run.status === "failed" ? (
                    <CircleAlert className="mt-0.5 h-4 w-4 text-destructive" />
                  ) : (
                    <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                  )}
                  <div>
                    <div className="font-mono text-xs uppercase tracking-[0.14em]">
                      {readableStage(run.stage ?? run.status)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {run.error_message ??
                        (run.prism_request_id
                          ? `Prism request ${run.prism_request_id}`
                          : "Bundle generation run")}
                    </div>
                  </div>
                </div>
                <div className="w-full lg:max-w-sm">
                  <Progress
                    value={runProgress[run.stage ?? run.status] ?? 12}
                    className="h-1.5 rounded-none bg-muted"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-border bg-muted/20 px-5 py-3 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              No Prism generation run has been linked to this Topic yet.
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="border border-border bg-card/50">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-xl">Source and audit</h2>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Source material
                </div>
                {topic.supporting_material_markdown ? (
                  <div className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap border border-border bg-background/50 p-4 font-mono text-xs leading-5 text-foreground/80">
                    {topic.supporting_material_markdown}
                  </div>
                ) : (
                  <div className="mt-3 flex min-h-32 items-center justify-center border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
                    No supporting material has been added.
                  </div>
                )}
                {currentSourceRevision ? (
                  <div className="mt-3 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Revision {currentSourceRevision}
                  </div>
                ) : null}
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Distribution checks
                </div>
                {auditChecks.length ? (
                  <div className="mt-3 grid gap-2">
                    {auditChecks.map((check) => (
                      <div
                        key={check.key}
                        className="flex items-start gap-3 border border-border bg-background/35 px-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "mt-0.5 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                            auditStyles[check.status],
                          )}
                        >
                          {check.status.replace("_", " ")}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{check.label}</div>
                          {check.evidence ? (
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              {check.evidence}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex min-h-32 items-center justify-center border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
                    CTA, attribution, metadata, and channel-readiness checks will
                    appear after the first Prism audit.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border border-border bg-card/50">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Link2 className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-xl">Bundle information</h2>
            </div>
            <dl className="grid gap-4 p-5 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Portal post
                </dt>
                <dd className="mt-1 break-all">{source.id ?? "Not linked"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Source revision
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {currentSourceRevision ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Prism request
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {run?.prism_request_id ?? "No run"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Created by
                </dt>
                <dd className="mt-1">{topic.created_by ?? "Unknown"}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                Channel outputs
              </div>
              <h2 className="mt-1 font-heading text-2xl">Drafts</h2>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {drafts.length} {drafts.length === 1 ? "Draft" : "Drafts"}
            </div>
          </div>
          {drafts.length ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  canEdit={canEdit}
                  currentSourceRevision={currentSourceRevision}
                  onToggleDagger={async (value) => {
                    await daggerMutation.mutateAsync(value);
                  }}
                  onRegenerate={(value) => {
                    setGenerationChannels([value.target_channel]);
                    setGenerationOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center border border-dashed border-border bg-card/30 px-5 text-center">
              <Layers3 className="h-6 w-6 text-muted-foreground" />
              <h3 className="mt-3 font-heading text-lg">No channel Drafts yet</h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Add Drafts manually or connect the Prism generation workflow to
                create channel-specific copy under this Topic.
              </p>
              <Button variant="outline" className="mt-4 rounded-sm" asChild>
                <Link href={`/?tab=drafts&topic=${encodeURIComponent(topic.id)}`}>
                  Open Drafts workspace
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section className="border border-border bg-card/50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-xl">Generated assets</h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {assets.length} {assets.length === 1 ? "asset" : "assets"}
            </span>
          </div>
          {assets.length ? (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center text-sm text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <p className="mt-3">
                Prism image briefs and generated image references will appear here.
              </p>
            </div>
          )}
        </section>

        <section className="border border-border bg-card/50">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-xl">Run history</h2>
          </div>
          <div className="p-5">
            {bundle.runs.length ? (
              <div className="divide-y divide-border border border-border bg-background/35">
                {bundle.runs.slice(0, 10).map((historyRun) => (
                  <div
                    key={historyRun.id}
                    className="grid gap-3 p-4 sm:grid-cols-[0.75fr_1fr_1.25fr_1.25fr] sm:items-center"
                  >
                    <StatusBadge status={historyRun.status} />
                    <div className="font-mono text-xs capitalize text-muted-foreground">
                      {readableStage(historyRun.stage)}
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                        Started
                      </div>
                      <div className="mt-1 text-xs">
                        {historyRun.started_at
                          ? displayDateTime(historyRun.started_at)
                          : displayDateTime(historyRun.created_at)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                        Prism request
                      </div>
                      <div className="mt-1 truncate font-mono text-xs">
                        {historyRun.prism_request_id ?? "Dispatch failed"}
                      </div>
                    </div>
                    {historyRun.error_message ? (
                      <div className="text-xs text-destructive sm:col-span-4">
                        {historyRun.error_message}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Run history will appear after Bard starts receiving Prism bundle metadata.
              </div>
            )}
          </div>
        </section>
      </main>

      <GenerationDialog
        open={generationOpen}
        onOpenChange={(open) => {
          setGenerationOpen(open);
          if (!open) setGenerationChannels(null);
        }}
        sourceId={source.id}
        sourceUrl={source.url}
        existingChannels={generationChannels ?? existingChannels}
        regenerationChannel={
          generationChannels?.length === 1 ? generationChannels[0] : null
        }
        pending={createRunMutation.isPending}
        onStart={async (payload) => {
          await createRunMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}

function BundleLoading() {
  return (
    <div className="noise-bg relative min-h-screen bg-background text-foreground">
      <TopBar rangeLabel="Content bundle" />
      <main className="relative z-10 mx-auto grid max-w-[1600px] gap-5 px-4 py-5 lg:px-6">
        <Skeleton className="h-8 w-28 rounded-sm" />
        <Skeleton className="h-44 w-full rounded-sm" />
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-80 rounded-sm" />
          <Skeleton className="h-80 rounded-sm" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-sm" />
          <Skeleton className="h-72 rounded-sm" />
          <Skeleton className="h-72 rounded-sm" />
        </div>
      </main>
    </div>
  );
}
