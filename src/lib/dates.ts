import { format, isValid, parseISO } from "date-fns";

export function parseIsoDate(value: string) {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function toIsoString(date: Date | string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsed = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function toDatetimeLocalValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}
