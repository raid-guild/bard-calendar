"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  ExternalLink,
  Eye,
  Plus,
  Save,
  Search,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChannelBadge } from "@/components/channel-badge";
import { StatusBadge } from "@/components/status-badge";
import { draftStatuses, topicStatuses } from "@/lib/content/constants";
import type { ContentDraft, ContentTopic, DraftPayload, TopicPayload } from "@/lib/content/types";
import { targetChannels } from "@/lib/events/constants";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/dates";

type DraftsViewProps = {
  topics: ContentTopic[];
  drafts: ContentDraft[];
  canEdit: boolean;
  saving: boolean;
  onSaveTopic: (topic: ContentTopic | null, payload: TopicPayload) => Promise<void>;
  onSaveDraft: (draft: ContentDraft | null, payload: DraftPayload) => Promise<void>;
  onToggleDagger: (draft: ContentDraft) => Promise<void>;
  onAssignDraft: (draft: ContentDraft, payload: { publish_at: string; status: string; name?: string }) => Promise<void>;
  onOpenAssignedEvent: (draft: ContentDraft) => Promise<void>;
};

type DraftSort = "created-asc" | "created-desc" | "title-asc" | "title-desc" | "publish-at";

type TopicForm = {
  title: string;
  supporting_material_markdown: string;
  status: string;
};

type DraftForm = {
  topic_id: string;
  title: string;
  target_channel: string;
  markdown_content: string;
  external_draft_url: string;
  status: string;
};

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function topicForm(topic: ContentTopic | null): TopicForm {
  return {
    title: topic?.title ?? "",
    supporting_material_markdown: topic?.supporting_material_markdown ?? "",
    status: topic?.status ?? "active",
  };
}

function draftForm(draft: ContentDraft | null, topicId: string): DraftForm {
  return {
    topic_id: draft?.topic_id ?? topicId,
    title: draft?.title ?? "",
    target_channel: draft?.target_channel ?? "discord",
    markdown_content: draft?.markdown_content ?? "",
    external_draft_url: draft?.external_draft_url ?? "",
    status: draft?.status ?? "draft",
  };
}

export function DraftsView({
  topics,
  drafts,
  canEdit,
  saving,
  onSaveTopic,
  onSaveDraft,
  onToggleDagger,
  onAssignDraft,
  onOpenAssignedEvent,
}: DraftsViewProps) {
  const [editingTopic, setEditingTopic] = useState<ContentTopic | null>(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const [topicState, setTopicState] = useState<TopicForm>(() => topicForm(null));
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftState, setDraftState] = useState<DraftForm>(() => draftForm(null, ""));
  const [assigningDraft, setAssigningDraft] = useState<ContentDraft | null>(null);
  const [assignAt, setAssignAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<DraftSort>("created-asc");

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return topics.filter((topic) => {
      if (!query) {
        return true;
      }

      if (topic.title.toLowerCase().includes(query)) {
        return true;
      }

      return drafts.some((draft) => draft.topic_id === topic.id && draft.title.toLowerCase().includes(query));
    });
  }, [drafts, searchQuery, topics]);

  const draftsByTopic = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const grouped = new Map<string, ContentDraft[]>();

    for (const draft of drafts) {
      const topic = topics.find((candidate) => candidate.id === draft.topic_id);
      const topicMatches = topic?.title.toLowerCase().includes(query) ?? false;
      const draftMatches = draft.title.toLowerCase().includes(query);

      if (query && !topicMatches && !draftMatches) {
        continue;
      }

      grouped.set(draft.topic_id, [...(grouped.get(draft.topic_id) ?? []), draft]);
    }

    grouped.forEach((topicDrafts, topicId) => {
      grouped.set(topicId, [...topicDrafts].sort((first, second) => {
        if (sort === "created-desc") {
          return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
        }

        if (sort === "title-asc") {
          return first.title.localeCompare(second.title);
        }

        if (sort === "title-desc") {
          return second.title.localeCompare(first.title);
        }

        if (sort === "publish-at") {
          const firstTime = first.assigned_publish_at ? new Date(first.assigned_publish_at).getTime() : Number.MAX_SAFE_INTEGER;
          const secondTime = second.assigned_publish_at ? new Date(second.assigned_publish_at).getTime() : Number.MAX_SAFE_INTEGER;
          return firstTime - secondTime || first.title.localeCompare(second.title);
        }

        return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
      }));
    });

    return grouped;
  }, [drafts, searchQuery, sort, topics]);

  const filteredDraftCount = useMemo(
    () => filteredTopics.reduce((count, topic) => count + (draftsByTopic.get(topic.id)?.length ?? 0), 0),
    [draftsByTopic, filteredTopics],
  );

  useEffect(() => {
    if (!topicOpen) {
      return;
    }

    setTopicState(topicForm(editingTopic));
  }, [editingTopic, topicOpen]);

  useEffect(() => {
    if (!draftOpen) {
      return;
    }

    setDraftState(draftForm(editingDraft, editingDraft?.topic_id ?? topics[0]?.id ?? ""));
  }, [draftOpen, editingDraft, topics]);

  const openNewTopic = () => {
    setEditingTopic(null);
    setTopicOpen(true);
  };

  const openNewDraft = (topicId: string) => {
    setEditingDraft(null);
    setDraftState(draftForm(null, topicId));
    setDraftOpen(true);
  };

  const saveTopic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveTopic(editingTopic, {
      title: topicState.title.trim(),
      supporting_material_markdown: optional(topicState.supporting_material_markdown),
      status: topicState.status,
    });
    setTopicOpen(false);
  };

  const saveDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveDraft(editingDraft, {
      topic_id: draftState.topic_id,
      title: draftState.title.trim(),
      target_channel: draftState.target_channel,
      markdown_content: draftState.markdown_content,
      external_draft_url: optional(draftState.external_draft_url),
      status: draftState.status,
    });
    setDraftOpen(false);
  };

  const assignDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assigningDraft) {
      return;
    }

    await onAssignDraft(assigningDraft, {
      publish_at: new Date(assignAt).toISOString(),
      status: "planned",
      name: assigningDraft.title,
    });
    setAssigningDraft(null);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {searchQuery.trim()
            ? `${filteredTopics.length} of ${topics.length} topics / ${filteredDraftCount} of ${drafts.length} drafts`
            : `${topics.length} topics / ${drafts.length} drafts`}
        </div>
        {canEdit ? (
          <Button className="rounded-sm" onClick={openNewTopic}>
            <Plus className="h-4 w-4" />
            Topic
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-sm pl-9"
            placeholder="Search names"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as DraftSort)}>
          <SelectTrigger className="rounded-sm sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created-asc">Created: oldest</SelectItem>
            <SelectItem value="created-desc">Created: newest</SelectItem>
            <SelectItem value="title-asc">Name: A-Z</SelectItem>
            <SelectItem value="title-desc">Name: Z-A</SelectItem>
            <SelectItem value="publish-at">Publish date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden border border-border bg-card/60">
        {topics.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No topics yet.</div>
        ) : filteredTopics.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No matching topics or drafts.</div>
        ) : (
          filteredTopics.map((topic) => {
            const topicDrafts = draftsByTopic.get(topic.id) ?? [];

            return (
              <section key={topic.id} className="border-b border-border last:border-b-0">
                <div className="flex flex-col gap-3 px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg">{topic.title}</h2>
                      <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {topic.status}
                      </span>
                    </div>
                  </div>
                  {canEdit ? (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-sm" onClick={() => openNewDraft(topic.id)}>
                        <StickyNote className="h-4 w-4" />
                        <Plus className="absolute right-1 top-1 h-2.5 w-2.5" />
                        <span className="sr-only">New draft</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-sm"
                        onClick={() => {
                          setEditingTopic(topic);
                          setTopicOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View/edit topic</span>
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-border px-4 py-3">
                  {topicDrafts.length === 0 ? (
                    <div className="border-l border-border/80 pl-4 text-sm text-muted-foreground lg:ml-6 lg:pl-5">No drafts for this topic.</div>
                  ) : (
                    <div className="divide-y divide-border/70 border-l border-border/80 lg:ml-6">
                      {topicDrafts.map((draft) => (
                        <div key={draft.id} className="grid gap-3 bg-background/25 px-4 py-2.5 lg:grid-cols-[1fr_auto] lg:items-center lg:pl-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground/90">{draft.title}</span>
                              <ChannelBadge channel={draft.target_channel} />
                              <StatusBadge status={draft.status as never} />
                              {draft.assigned_publish_at ? (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {formatDateTime(draft.assigned_publish_at)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                            {draft.external_draft_url ? (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-sm" asChild>
                                <a href={draft.external_draft_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">Open external draft</span>
                                </a>
                              </Button>
                            ) : null}
                            {canEdit ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-sm"
                                  onClick={async () => {
                                    if (draft.assigned_event_id) {
                                      await onOpenAssignedEvent(draft);
                                      return;
                                    }

                                    setAssigningDraft(draft);
                                    setAssignAt(toDatetimeLocalValue(draft.assigned_publish_at ?? new Date()));
                                  }}
                                >
                                  {draft.assigned_event_id ? <CalendarCheck className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
                                  <span className="sr-only">{draft.assigned_event_id ? "Open linked event" : "Assign to calendar"}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-sm"
                                  onClick={() => {
                                    setEditingDraft(draft);
                                    setDraftOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View/edit draft</span>
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>

      <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
        <DialogContent className="h-dvh max-h-dvh w-screen max-w-none gap-0 border-border bg-background p-0 sm:rounded-none">
          <form onSubmit={saveTopic} className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b border-border px-6 py-5 pr-14">
              <DialogTitle>{editingTopic ? "Edit topic" : "New topic"}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-2">
                <Label htmlFor="topic-title">Title</Label>
                <Input id="topic-title" value={topicState.title} onChange={(event) => setTopicState((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              <div className="grid gap-2">
                <Label>Topic status</Label>
                <Select value={topicState.status} onValueChange={(status) => setTopicState((current) => ({ ...current, status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {topicStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic-material">Supporting material</Label>
                <Textarea id="topic-material" className="min-h-[55vh] font-mono text-xs" value={topicState.supporting_material_markdown} onChange={(event) => setTopicState((current) => ({ ...current, supporting_material_markdown: event.target.value }))} />
              </div>
            </div>
            <DialogFooter className="border-t border-border px-6 py-4">
              <Button type="submit" className="rounded-sm" disabled={saving}><Save className="h-4 w-4" />Save topic</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent className="h-dvh max-h-dvh w-screen max-w-none gap-0 border-border bg-background p-0 sm:rounded-none">
          <form onSubmit={saveDraft} className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b border-border px-6 py-5 pr-14">
              <DialogTitle>{editingDraft ? "Edit draft" : "New draft"}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Topic</Label>
                  <Select value={draftState.topic_id} onValueChange={(topic_id) => setDraftState((current) => ({ ...current, topic_id }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{topics.map((topic) => <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Channel</Label>
                  <Select value={draftState.target_channel} onValueChange={(target_channel) => setDraftState((current) => ({ ...current, target_channel }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{targetChannels.map((channel) => <SelectItem key={channel} value={channel}>{channel}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="draft-title">Title</Label>
                <Input id="draft-title" value={draftState.title} onChange={(event) => setDraftState((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Draft status</Label>
                  <Select value={draftState.status} onValueChange={(status) => setDraftState((current) => ({ ...current, status }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{draftStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="external-draft">External draft URL</Label>
                  <Input id="external-draft" type="url" value={draftState.external_draft_url} onChange={(event) => setDraftState((current) => ({ ...current, external_draft_url: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="draft-copy">Markdown content</Label>
                <ScrollArea className="h-[55vh] min-h-[24rem] rounded-sm border border-input">
                  <Textarea id="draft-copy" className="min-h-[55vh] resize-none border-0 font-mono text-xs focus-visible:ring-0" value={draftState.markdown_content} onChange={(event) => setDraftState((current) => ({ ...current, markdown_content: event.target.value }))} />
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="border-t border-border px-6 py-4">
              <Button type="submit" className="rounded-sm" disabled={saving || !draftState.topic_id}><Save className="h-4 w-4" />Save draft</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assigningDraft)} onOpenChange={(open) => !open && setAssigningDraft(null)}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <form onSubmit={assignDraft} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Assign to calendar</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="assign-at">Publish date/time</Label>
              <Input id="assign-at" type="datetime-local" value={assignAt} onChange={(event) => setAssignAt(event.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" className="rounded-sm" disabled={saving}><CalendarPlus className="h-4 w-4" />Assign</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
