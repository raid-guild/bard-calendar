"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from "react-big-calendar";
import { statusColors } from "@/lib/events/constants";
import type { PublishingEvent } from "@/lib/events/types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

type CalendarViewProps = {
  events: PublishingEvent[];
  date: Date;
  view: View;
  onDateChange: (date: Date) => void;
  onViewChange: (view: View) => void;
  onSelectSlot: (date: Date) => void;
  onSelectEvent: (event: PublishingEvent) => void;
  canEdit: boolean;
};

export function CalendarView({
  events,
  date,
  view,
  onDateChange,
  onViewChange,
  onSelectSlot,
  onSelectEvent,
  canEdit,
}: CalendarViewProps) {
  const calendarEvents = events.map((event) => ({
    ...event,
    title: `[${event.target_channel}] ${event.name}`,
    start: new Date(event.publish_at),
    end: new Date(new Date(event.publish_at).getTime() + 30 * 60_000),
  }));

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
        onSelectEvent={(event) => onSelectEvent(event as PublishingEvent)}
        selectable={canEdit}
        popup
        eventPropGetter={(event) => {
          const color = statusColors[event.status as keyof typeof statusColors] ?? "hsl(160 63% 50%)";
          return {
            style: {
              backgroundColor: color,
              color: event.status === "planned" ? "hsl(240 20% 3%)" : "white",
            },
          };
        }}
      />
    </div>
  );
}
