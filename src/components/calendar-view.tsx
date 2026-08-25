"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from "react-big-calendar";
import { statusColors } from "@/lib/events/constants";
import type { PublishingEvent } from "@/lib/events/types";
import type { ContentTopic } from "@/lib/content/types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

type CalendarViewProps = {
  events: PublishingEvent[];
  topics: ContentTopic[];
  date: Date;
  view: View;
  onDateChange: (date: Date) => void;
  onViewChange: (view: View) => void;
  onSelectSlot: (date: Date) => void;
  onSelectEvent: (event: PublishingEvent) => void;
  onSelectTopic: (topic: ContentTopic) => void;
  canEdit: boolean;
};

export function CalendarView({
  events,
  topics,
  date,
  view,
  onDateChange,
  onViewChange,
  onSelectSlot,
  onSelectEvent,
  onSelectTopic,
  canEdit,
}: CalendarViewProps) {
  const publishedTopicIds = new Set(topics.filter((topic) => topic.publication_status === "published" && topic.publication_at).map((topic) => topic.id));
  const outputEvents = events.filter((event) => !event.topic_id || !publishedTopicIds.has(event.topic_id)).map((event) => ({
    ...event,
    entry_kind: "output" as const,
    title: `[${event.target_channel}] ${event.name}`,
    start: new Date(event.publish_at),
    end: new Date(new Date(event.publish_at).getTime() + 30 * 60_000),
  }));
  const topicEvents = topics.filter((topic) => topic.publication_status === "published" && topic.publication_at).map((topic) => {
    const outputs = events.filter((event) => event.topic_id === topic.id);
    return {
      ...topic,
      entry_kind: "topic" as const,
      title: `[topic] ${topic.title}${outputs.length ? ` · ${outputs.length} outputs` : ""}`,
      start: new Date(topic.publication_at!),
      end: new Date(new Date(topic.publication_at!).getTime() + 30 * 60_000),
      child_outputs: outputs,
    };
  });
  const calendarEvents = [...topicEvents, ...outputEvents];

  return (
    <div className="h-[calc(100vh-13rem)] min-h-[560px] overflow-hidden border border-border bg-card/60">
      <Calendar
        date={date}
        view={view}
        views={["month", "week"]}
        localizer={localizer}
        events={calendarEvents}
        onNavigate={onDateChange}
        onView={onViewChange}
        onSelectSlot={(slot: SlotInfo) => {
          if (canEdit) {
            onSelectSlot(slot.start);
          }
        }}
        onSelectEvent={(event) => event.entry_kind === "topic" ? onSelectTopic(event as unknown as ContentTopic) : onSelectEvent(event as PublishingEvent)}
        selectable={canEdit}
        popup
        eventPropGetter={(event) => {
          const color = event.entry_kind === "topic" ? "hsl(173 80% 40%)" : statusColors[event.status as keyof typeof statusColors] ?? "hsl(160 63% 50%)";
          return {
            style: {
              backgroundColor: color,
              color: event.entry_kind === "topic" || event.status !== "planned" ? "white" : "hsl(240 20% 3%)",
            },
          };
        }}
      />
    </div>
  );
}
