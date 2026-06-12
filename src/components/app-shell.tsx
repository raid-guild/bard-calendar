"use client";

import { useMemo, useState } from "react";
import { addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { View } from "react-big-calendar";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar-view";
import { EventDrawer } from "@/components/event-drawer";
import { EventsTable } from "@/components/events-table";
import { Filters } from "@/components/filters";
import { PortalLaunchRequired } from "@/components/portal-launch-required";
import { TopBar } from "@/components/top-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createEvent, deleteEvent, fetchEvents, updateEvent } from "@/lib/events/client";
import type { EventFilters, EventPayload, PublishingEvent } from "@/lib/events/types";

type PortalSessionResponse = {
  user?: {
    name?: string;
    handle?: string;
    picture?: string;
    roles: string[];
  };
  canView: boolean;
  canEdit: boolean;
  portalModulesUrl: string;
};

function rangeFor(date: Date, view: View) {
  if (view === "week") {
    return {
      start: startOfWeek(date).toISOString(),
      end: endOfWeek(date).toISOString(),
      label: `${format(startOfWeek(date), "MMM d")} - ${format(endOfWeek(date), "MMM d, yyyy")}`,
    };
  }

  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
    label: format(date, "MMMM yyyy"),
  };
}

function navigateDate(date: Date, view: View, action: "TODAY" | "PREV" | "NEXT") {
  if (action === "TODAY") {
    return new Date();
  }

  if (view === "week") {
    return action === "PREV" ? subWeeks(date, 1) : addWeeks(date, 1);
  }

  return action === "PREV" ? subMonths(date, 1) : addMonths(date, 1);
}

async function fetchPortalSession(): Promise<PortalSessionResponse> {
  const response = await fetch("/api/session", { cache: "no-store" });
  const json = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return {
      canView: false,
      canEdit: false,
      portalModulesUrl: json.portalModulesUrl ?? "https://portal.raidguild.org/modules",
    } satisfies PortalSessionResponse;
  }

  if (!response.ok) {
    throw new Error(json.error ?? "Unable to load Portal session.");
  }

  return json as PortalSessionResponse;
}

export function AppShell() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [filters, setFilters] = useState<EventFilters>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PublishingEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  const range = useMemo(() => rangeFor(date, view), [date, view]);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      start: filters.start ?? range.start,
      end: filters.end ?? range.end,
    }),
    [filters, range.end, range.start],
  );

  const sessionQuery = useQuery({
    queryKey: ["portal-session"],
    queryFn: fetchPortalSession,
    retry: false,
  });

  const canView = sessionQuery.data?.canView === true;
  const canEdit = sessionQuery.data?.canEdit === true;

  const eventsQuery = useQuery({
    queryKey: ["events", queryFilters],
    queryFn: () => fetchEvents(queryFilters),
    enabled: canView,
  });

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await invalidateEvents();
      setDrawerOpen(false);
      toast.success("Event created.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EventPayload }) => updateEvent(id, payload),
    onSuccess: async () => {
      await invalidateEvents();
      setDrawerOpen(false);
      toast.success("Event updated.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: async () => {
      await invalidateEvents();
      setDrawerOpen(false);
      toast.success("Event deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  const events = eventsQuery.data ?? [];

  const openNewEvent = (prefilledDate = new Date()) => {
    if (!canEdit) {
      return;
    }

    setSelectedEvent(null);
    setInitialDate(prefilledDate);
    setDrawerOpen(true);
  };

  const openExistingEvent = (event: PublishingEvent) => {
    setSelectedEvent(event);
    setInitialDate(null);
    setDrawerOpen(true);
  };

  const saveEvent = async (payload: EventPayload) => {
    if (!canEdit) {
      return;
    }

    if (selectedEvent) {
      await updateMutation.mutateAsync({ id: selectedEvent.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  const removeEvent = async () => {
    if (!canEdit) {
      return;
    }

    if (selectedEvent) {
      await deleteMutation.mutateAsync(selectedEvent.id);
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="noise-bg relative flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="relative z-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Checking Portal access
        </div>
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <PortalLaunchRequired
        title="Portal session unavailable"
        message="We could not verify your Portal session. Please return to the Portal and open the calendar again."
        portalModulesUrl="https://portal.raidguild.org/modules"
      />
    );
  }

  if (!canView) {
    const hasSession = Boolean(sessionQuery.data?.user);

    return (
      <PortalLaunchRequired
        title={hasSession ? "Calendar access unavailable" : "Raid Guild Content Calendar"}
        message={
          hasSession
            ? "Your Portal account does not currently have access to this module."
            : "This module needs to be opened from the Raid Guild Portal."
        }
        portalModulesUrl={sessionQuery.data?.portalModulesUrl ?? "https://portal.raidguild.org/modules"}
      />
    );
  }

  return (
    <div className="noise-bg relative min-h-screen bg-background text-foreground">
      <TopBar
        rangeLabel={range.label}
        view={view}
        canEdit={canEdit}
        onViewChange={setView}
        onNavigate={(action) => setDate((current) => navigateDate(current, view, action))}
        onNewEvent={() => openNewEvent(new Date())}
      />

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
        <Tabs defaultValue="calendar" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="grid w-full grid-cols-2 rounded-sm border border-border bg-muted/40 lg:w-[280px]">
              <TabsTrigger value="calendar" className="rounded-sm font-mono text-xs uppercase tracking-[0.14em]">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-sm font-mono text-xs uppercase tracking-[0.14em]">
                List
              </TabsTrigger>
            </TabsList>
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {eventsQuery.isFetching ? "Syncing events" : `${events.length} events loaded`}
            </div>
          </div>

          <TabsContent value="calendar" className="m-0 space-y-4">
            <CalendarView
              events={events}
              date={date}
              view={view}
              onDateChange={setDate}
              onViewChange={setView}
              onSelectSlot={openNewEvent}
              onSelectEvent={openExistingEvent}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="list" className="m-0 space-y-0">
            <Filters filters={filters} onChange={setFilters} />
            <EventsTable events={events} onSelectEvent={openExistingEvent} />
          </TabsContent>
        </Tabs>
      </main>

      <EventDrawer
        open={drawerOpen}
        event={selectedEvent}
        initialDate={initialDate}
        saving={createMutation.isPending || updateMutation.isPending}
        deleting={deleteMutation.isPending}
        readOnly={!canEdit}
        onOpenChange={setDrawerOpen}
        onSave={saveEvent}
        onDelete={removeEvent}
      />
    </div>
  );
}
