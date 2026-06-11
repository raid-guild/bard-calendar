"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelBadge } from "@/components/channel-badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/dates";
import type { PublishingEvent } from "@/lib/events/types";

type EventsTableProps = {
  events: PublishingEvent[];
  onSelectEvent: (event: PublishingEvent) => void;
};

function LinkCell({ href }: { href: string | null }) {
  if (!href) {
    return <span className="text-muted-foreground/50">-</span>;
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-primary" asChild>
      <a href={href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
        <ExternalLink className="h-4 w-4" />
        <span className="sr-only">Open link</span>
      </a>
    </Button>
  );
}

export function EventsTable({ events, onSelectEvent }: EventsTableProps) {
  return (
    <div className="overflow-hidden border border-border bg-card/60">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Publish</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Name</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Channel</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Status</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Type</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Campaign</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Owner</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Draft</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Media</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                No events found.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer"
                onClick={() => onSelectEvent(event)}
              >
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {formatDateTime(event.publish_at)}
                </TableCell>
                <TableCell className="min-w-[260px] font-medium">{event.name}</TableCell>
                <TableCell>
                  <ChannelBadge channel={event.target_channel} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={event.status} />
                </TableCell>
                <TableCell>{event.content_type ?? "-"}</TableCell>
                <TableCell>{event.campaign ?? "-"}</TableCell>
                <TableCell>{event.owner ?? "-"}</TableCell>
                <TableCell>
                  <LinkCell href={event.draft_url} />
                </TableCell>
                <TableCell>
                  <LinkCell href={event.media_url} />
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {formatDateTime(event.updated_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
