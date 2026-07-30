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

export function withLocalDate(value: string, date: Date) {
  const current = new Date(value);
  const hour = Number.isNaN(current.getTime()) ? 0 : current.getHours();
  return toDatetimeLocalValue(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour),
  );
}

export function withLocalHour(value: string, hour: number) {
  const current = new Date(value);
  const base = Number.isNaN(current.getTime()) ? new Date() : current;
  return toDatetimeLocalValue(
    new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      Math.min(23, Math.max(0, Math.round(hour))),
    ),
  );
}
