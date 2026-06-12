"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { View } from "react-big-calendar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type TopBarProps = {
  rangeLabel: string;
  view: View;
  canEdit: boolean;
  onViewChange: (view: View) => void;
  onNavigate: (action: "TODAY" | "PREV" | "NEXT") => void;
  onNewEvent: () => void;
};

export function TopBar({
  rangeLabel,
  view,
  canEdit,
  onViewChange,
  onNavigate,
  onNewEvent,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-accent">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "RaidGuild Content Calendar"}
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {view} / {rangeLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value === "month" || value === "week") {
                onViewChange(value);
              }
            }}
            className="rounded-sm border border-border bg-muted/30 p-0.5"
          >
            <ToggleGroupItem
              value="month"
              aria-label="Show month view"
              className="h-8 rounded-sm px-3 font-mono text-xs uppercase tracking-[0.14em] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Month
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              aria-label="Show week view"
              className="h-8 rounded-sm px-3 font-mono text-xs uppercase tracking-[0.14em] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Week
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm border-primary/30 font-mono text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/10"
            onClick={() => onNavigate("TODAY")}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-sm"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-sm"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
          {canEdit ? (
            <Button
              size="sm"
              className="rounded-sm font-heading text-xs uppercase tracking-wider"
              onClick={onNewEvent}
            >
              <Plus className="mr-2 h-4 w-4" />
              New event
            </Button>
          ) : (
            <div className="border border-border bg-muted/30 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              View only
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
