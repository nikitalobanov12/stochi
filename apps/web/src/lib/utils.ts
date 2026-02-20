import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to 24-hour time string (HH:MM)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get the start of day (midnight) in a specific timezone.
 * This is critical for determining "today" in the user's local context.
 *
 * The function calculates when midnight occurred in the user's timezone
 * and returns that as a UTC Date object for database queries.
 *
 * @param timezone - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns Date object representing midnight in the specified timezone (as UTC)
 *
 * @example
 * // User in Pacific time (UTC-8), server in UTC
 * // If it's Dec 26 10:00 AM Pacific (6:00 PM UTC)
 * // Returns Dec 26 00:00 Pacific = Dec 26 08:00 UTC
 */
export function getStartOfDayInTimezone(
  timezone: string | null | undefined,
): Date {
  const now = new Date();

  if (!timezone) {
    // Fallback to server's local time if no timezone
    now.setHours(0, 0, 0, 0);
    return now;
  }

  // Get the current date parts in user's timezone
  // Using 'en-CA' locale gives us YYYY-MM-DD format
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // This gives us the date as the user sees it (e.g., "2024-12-26")
  const dateStr = formatter.format(now);
  const [year, month, day] = dateStr.split("-").map(Number) as [
    number,
    number,
    number,
  ];

  // Now we need to find the UTC timestamp for midnight in user's timezone
  // Strategy: Create a date at midnight UTC for that calendar date,
  // then adjust by the timezone offset

  // Get the offset for this timezone at roughly midnight of that day
  // We'll use noon to avoid DST edge cases
  const roughMidnight = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Get timezone offset in minutes using Intl
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });

  const parts = offsetFormatter.formatToParts(roughMidnight);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";

  // Parse offset like "GMT-08:00" or "GMT+05:30"
  const offsetMatch = tzPart.match(/GMT([+-])(\d{2}):(\d{2})/);
  let offsetMinutes = 0;
  if (offsetMatch) {
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const hours = parseInt(offsetMatch[2]!, 10);
    const mins = parseInt(offsetMatch[3]!, 10);
    offsetMinutes = sign * (hours * 60 + mins);
  }

  // Midnight in user's timezone = midnight UTC minus the offset
  // If user is UTC-8, midnight local = 08:00 UTC (we add 8 hours = subtract -8 hours)
  const midnightUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return new Date(midnightUtc.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Format a date relative to today (Today, Yesterday, or date string)
 */
export function formatRelativeDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return "Today";
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a timestamp relative to now for short display
 * e.g., "2h ago", "Yesterday", "Dec 15"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour ago
  if (diffMins < 60) {
    if (diffMins < 1) return "Just now";
    return `${diffMins}m ago`;
  }

  // Less than 24 hours ago
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // Less than 7 days ago
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Older - show date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
