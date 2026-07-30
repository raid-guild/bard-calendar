"use client";

import { format } from "date-fns";
import { CalendarIcon, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withLocalDate, withLocalHour } from "@/lib/dates";

const hours = Array.from({ length: 24 }, (_, hour) => hour);
const hourLabel = (hour: number) =>
  format(new Date(2000, 0, 1, hour), "h a");

export function DateHourPicker({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const parsed = new Date(value);
  const selected = Number.isNaN(parsed.getTime()) ? undefined : parsed;
  const hour = selected?.getHours() ?? 0;

  return (
    <div id={id} className="grid grid-cols-[1fr_8rem] gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="justify-start rounded-sm font-normal"
            aria-label="Choose publish date"
          >
            <CalendarIcon className="h-4 w-4" />
            {selected ? format(selected, "MMM d, yyyy") : "Choose date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => date && onChange(withLocalDate(value, date))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Select
        value={String(hour)}
        onValueChange={(next) => onChange(withLocalHour(value, Number(next)))}
        disabled={disabled}
      >
        <SelectTrigger className="rounded-sm" aria-label="Choose publish hour">
          <Clock3 className="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((item) => (
            <SelectItem key={item} value={String(item)}>
              {hourLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
