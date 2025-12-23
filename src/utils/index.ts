import { format, parseISO, isValid } from "date-fns";

export function createPageUrl(pageName: string) {
    return '/' + pageName;
}

export function safeFormatDate(dateValue: string | Date | null | undefined, formatStr: string = "MMM d, yyyy"): string | null {
  if (!dateValue) return null;
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, formatStr) : null;
  } catch {
    return null;
  }
}
