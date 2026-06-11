"use client";

import { ListFilter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishingStatuses, targetChannels } from "@/lib/events/constants";
import type { EventFilters } from "@/lib/events/types";

type FiltersProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
};

const allValue = "__all__";

export function Filters({ filters, onChange }: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background/50 p-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <ListFilter className="h-4 w-4 text-primary" />
        Filters
      </div>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search ?? ""}
          onChange={(event) => onChange({ ...filters, search: event.target.value || undefined })}
          placeholder="Search name, notes, campaign"
          className="h-9 rounded-sm pl-9"
        />
      </div>
      <Select
        value={filters.target_channel ?? allValue}
        onValueChange={(value) =>
          onChange({ ...filters, target_channel: value === allValue ? undefined : value })
        }
      >
        <SelectTrigger className="h-9 w-full rounded-sm lg:w-[150px]">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allValue}>All channels</SelectItem>
          {targetChannels.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? allValue}
        onValueChange={(value) => onChange({ ...filters, status: value === allValue ? undefined : value })}
      >
        <SelectTrigger className="h-9 w-full rounded-sm lg:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allValue}>All statuses</SelectItem>
          {publishingStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={filters.owner ?? ""}
        onChange={(event) => onChange({ ...filters, owner: event.target.value || undefined })}
        placeholder="Owner"
        className="h-9 rounded-sm lg:w-[150px]"
      />
    </div>
  );
}
