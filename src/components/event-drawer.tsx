"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { publishingStatuses, targetChannels } from "@/lib/events/constants";
import type { EventPayload, PublishingEvent } from "@/lib/events/types";
import { toDatetimeLocalValue } from "@/lib/dates";

type EventDrawerProps = {
  open: boolean;
  event: PublishingEvent | null;
  initialDate: Date | null;
  saving: boolean;
  deleting: boolean;
  readOnly: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: EventPayload) => Promise<void>;
  onDelete: () => Promise<void>;
};

type FormState = {
  name: string;
  publish_at: string;
  target_channel: string;
  status: string;
  content_type: string;
  campaign: string;
  owner: string;
  draft_url: string;
  media_url: string;
  live_url: string;
  notes: string;
  metadata: string;
};

function emptyState(initialDate: Date): FormState {
  return {
    name: "",
    publish_at: toDatetimeLocalValue(initialDate),
    target_channel: "discord",
    status: "planned",
    content_type: "",
    campaign: "",
    owner: "",
    draft_url: "",
    media_url: "",
    live_url: "",
    notes: "",
    metadata: "{}",
  };
}

function stateFromEvent(event: PublishingEvent): FormState {
  return {
    name: event.name,
    publish_at: toDatetimeLocalValue(event.publish_at),
    target_channel: event.target_channel,
    status: event.status,
    content_type: event.content_type ?? "",
    campaign: event.campaign ?? "",
    owner: event.owner ?? "",
    draft_url: event.draft_url ?? "",
    media_url: event.media_url ?? "",
    live_url: event.live_url ?? "",
    notes: event.notes ?? "",
    metadata: JSON.stringify(event.metadata ?? {}, null, 2),
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function EventDrawer({
  open,
  event,
  initialDate,
  saving,
  deleting,
  readOnly,
  onOpenChange,
  onSave,
  onDelete,
}: EventDrawerProps) {
  const fallbackDate = useMemo(() => initialDate ?? new Date(), [initialDate]);
  const [form, setForm] = useState<FormState>(() => emptyState(fallbackDate));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setForm(event ? stateFromEvent(event) : emptyState(initialDate ?? new Date()));
  }, [event, initialDate, open]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (readOnly) {
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    let metadata: Record<string, unknown> = {};

    try {
      metadata = form.metadata.trim() ? JSON.parse(form.metadata) : {};
    } catch {
      setError("Metadata JSON must parse.");
      return;
    }

    if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
      setError("Metadata JSON must be an object.");
      return;
    }

    setError(null);
    await onSave({
      name: form.name.trim(),
      publish_at: new Date(form.publish_at).toISOString(),
      target_channel: form.target_channel,
      status: form.status,
      content_type: optional(form.content_type),
      campaign: optional(form.campaign),
      owner: optional(form.owner),
      draft_url: optional(form.draft_url),
      media_url: optional(form.media_url),
      live_url: optional(form.live_url),
      notes: optional(form.notes),
      metadata,
    });
  };

  const handleDelete = async () => {
    if (!event) {
      return;
    }

    if (window.confirm("Delete this publishing event?")) {
      await onDelete();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-heading text-xl">
            {readOnly ? "View event" : event ? "Edit event" : "New event"}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs uppercase tracking-[0.16em]">
            {readOnly ? "Read-only publishing details" : "Publishing intent, draft links, channel, and status"}
          </SheetDescription>
        </SheetHeader>

        <form id="event-form" onSubmit={handleSubmit} className="min-h-0 flex-1">
          <ScrollArea className="h-[calc(100vh-11rem)]">
            <div className="grid gap-5 px-6 py-6">
              {error ? (
                <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(inputEvent) => setField("name", inputEvent.target.value)}
                  required
                  disabled={readOnly}
                  className="rounded-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="publish_at">Publish date/time</Label>
                  <Input
                    id="publish_at"
                    type="datetime-local"
                    value={form.publish_at}
                    onChange={(inputEvent) => setField("publish_at", inputEvent.target.value)}
                    required
                    disabled={readOnly}
                    className="rounded-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Target channel</Label>
                  <Select
                    value={form.target_channel}
                    onValueChange={(value) => setField("target_channel", value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetChannels.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {channel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setField("status", value)} disabled={readOnly}>
                    <SelectTrigger className="rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {publishingStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content_type">Content type</Label>
                  <Input
                    id="content_type"
                    value={form.content_type}
                    onChange={(inputEvent) => setField("content_type", inputEvent.target.value)}
                    disabled={readOnly}
                    className="rounded-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="campaign">Campaign</Label>
                  <Input
                  id="campaign"
                  value={form.campaign}
                  onChange={(inputEvent) => setField("campaign", inputEvent.target.value)}
                  disabled={readOnly}
                  className="rounded-sm"
                />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={form.owner}
                    onChange={(inputEvent) => setField("owner", inputEvent.target.value)}
                    disabled={readOnly}
                    className="rounded-sm"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="draft_url">Draft URL</Label>
                <Input
                  id="draft_url"
                  type="url"
                  value={form.draft_url}
                  onChange={(inputEvent) => setField("draft_url", inputEvent.target.value)}
                  disabled={readOnly}
                  className="rounded-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="media_url">Media URL</Label>
                  <Input
                    id="media_url"
                    type="url"
                    value={form.media_url}
                    onChange={(inputEvent) => setField("media_url", inputEvent.target.value)}
                    disabled={readOnly}
                    className="rounded-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="live_url">Live URL</Label>
                  <Input
                    id="live_url"
                    type="url"
                    value={form.live_url}
                    onChange={(inputEvent) => setField("live_url", inputEvent.target.value)}
                    disabled={readOnly}
                    className="rounded-sm"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(inputEvent) => setField("notes", inputEvent.target.value)}
                  disabled={readOnly}
                  className="min-h-28 rounded-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metadata">Metadata JSON</Label>
                <Textarea
                  id="metadata"
                  value={form.metadata}
                  onChange={(inputEvent) => setField("metadata", inputEvent.target.value)}
                  disabled={readOnly}
                  className="min-h-32 rounded-sm font-mono text-xs"
                  spellCheck={false}
                />
              </div>
            </div>
          </ScrollArea>
        </form>

        {readOnly ? null : (
          <SheetFooter className="border-t border-border px-6 py-4">
            {event ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-sm"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting" : "Delete"}
            </Button>
            ) : null}
            <Button form="event-form" type="submit" className="rounded-sm" disabled={saving || deleting}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving" : "Save event"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
