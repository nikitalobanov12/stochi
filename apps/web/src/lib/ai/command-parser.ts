/**
 * Hybrid NLP Parser for Command Bar
 *
 * Combines regex-based extraction for structured data (dosage, units, time)
 * with semantic search for fuzzy supplement matching.
 */

import { supplementAliases } from "~/server/data/supplement-aliases";

// Regex patterns for structured extraction
const DOSAGE_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|ml)\b/gi;
const TIME_PATTERN =
  /\b(morning|afternoon|evening|night|breakfast|lunch|dinner|before\s+bed)\b/gi;
const QUANTITY_PATTERN =
  /\b(\d+)\s*(caps?(?:ules?)?|tabs?(?:lets?)?|pills?|softgels?|drops?)\b/gi;

// Clock time patterns: "8am", "10:30pm", "8 am", "at 8am", etc.
const CLOCK_TIME_PATTERN = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;

// Relative time patterns: "this morning", "last night", "2 hours ago"
const RELATIVE_TIME_PATTERN =
  /\b(this\s+(?:morning|afternoon|evening)|last\s+night|yesterday|(\d+)\s+hours?\s+ago)\b/gi;

export type ParsedDosage = {
  value: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export type ParsedQuantity = {
  count: number;
  form: string;
};

export type ParsedTime = {
  /** The parsed Date object */
  date: Date;
  /** Human-readable description of what was parsed */
  description: string;
};

export type ParsedCommand = {
  /** Raw input text */
  raw: string;
  /** Extracted supplement search query (text without dosage/time) */
  supplementQuery: string;
  /** Parsed dosage if found */
  dosage: ParsedDosage | null;
  /** Parsed quantity if found (e.g., "2 caps") */
  quantity: ParsedQuantity | null;
  /** Time of day if mentioned (legacy - descriptive only) */
  timeContext: string | null;
  /** Parsed actual time if found (e.g., "8am" → Date) */
  parsedTime: ParsedTime | null;
  /** Confidence that this is a valid log command */
  isValid: boolean;
};

/**
 * Parse a clock time string (e.g., "8am", "10:30pm") to a Date object.
 * Returns a Date for today at that time, or yesterday if the time has passed.
 */
function parseClockTime(
  hours: string,
  minutes: string | undefined,
  ampm: string,
): ParsedTime {
  const now = new Date();
  let hour = parseInt(hours, 10);
  const minute = minutes ? parseInt(minutes, 10) : 0;

  // Convert to 24-hour format
  if (ampm.toLowerCase() === "pm" && hour !== 12) {
    hour += 12;
  } else if (ampm.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }

  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);

  // If the time is in the future (more than 5 minutes from now), assume yesterday
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  if (date > fiveMinutesFromNow) {
    date.setDate(date.getDate() - 1);
  }

  const timeStr = `${hours}${minutes ? `:${minutes}` : ""}${ampm.toLowerCase()}`;
  return {
    date,
    description: timeStr,
  };
}

/**
 * Parse a relative time expression (e.g., "this morning", "2 hours ago").
 */
function parseRelativeTime(match: string): ParsedTime | null {
  const now = new Date();
  const lowerMatch = match.toLowerCase();

  if (lowerMatch === "this morning") {
    const date = new Date(now);
    date.setHours(8, 0, 0, 0); // Default to 8am
    // If it's before 8am, use yesterday morning
    if (now.getHours() < 8) {
      date.setDate(date.getDate() - 1);
    }
    return { date, description: "this morning" };
  }

  if (lowerMatch === "this afternoon") {
    const date = new Date(now);
    date.setHours(14, 0, 0, 0); // Default to 2pm
    if (now.getHours() < 12) {
      date.setDate(date.getDate() - 1);
    }
    return { date, description: "this afternoon" };
  }

  if (lowerMatch === "this evening") {
    const date = new Date(now);
    date.setHours(19, 0, 0, 0); // Default to 7pm
    if (now.getHours() < 17) {
      date.setDate(date.getDate() - 1);
    }
    return { date, description: "this evening" };
  }

  if (lowerMatch === "last night") {
    const date = new Date(now);
    date.setHours(22, 0, 0, 0); // Default to 10pm
    date.setDate(date.getDate() - 1);
    return { date, description: "last night" };
  }

  if (lowerMatch === "yesterday") {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    // Keep the current time but yesterday
    return { date, description: "yesterday" };
  }

  // Match "X hours ago"
  const hoursAgoMatch = /(\d+)\s+hours?\s+ago/i.exec(lowerMatch);
  if (hoursAgoMatch?.[1]) {
    const hoursAgo = parseInt(hoursAgoMatch[1], 10);
    const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return {
      date,
      description: `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`,
    };
  }

  return null;
}

/**
 * Parse a command bar input using regex for structured data
 */
export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  let supplementQuery = raw;

  // Extract dosage
  let dosage: ParsedDosage | null = null;
  const dosageMatch = DOSAGE_PATTERN.exec(raw);
  DOSAGE_PATTERN.lastIndex = 0; // Reset regex state

  if (dosageMatch?.[1] && dosageMatch[2]) {
    const value = parseFloat(dosageMatch[1]);
    const unitRaw = dosageMatch[2].toLowerCase();
    const unit =
      unitRaw === "iu" ? "IU" : (unitRaw as "mg" | "mcg" | "g" | "ml");
    dosage = { value, unit };
    supplementQuery = supplementQuery.replace(dosageMatch[0], "").trim();
  }

  // Extract quantity (e.g., "2 caps")
  let quantity: ParsedQuantity | null = null;
  const quantityMatch = QUANTITY_PATTERN.exec(raw);
  QUANTITY_PATTERN.lastIndex = 0;

  if (quantityMatch?.[1] && quantityMatch[2]) {
    quantity = {
      count: parseInt(quantityMatch[1], 10),
      form: quantityMatch[2].toLowerCase(),
    };
    supplementQuery = supplementQuery.replace(quantityMatch[0], "").trim();
  }

  // Extract parsed time (clock time like "8am", "10:30pm")
  let parsedTime: ParsedTime | null = null;
  const clockTimeMatch = CLOCK_TIME_PATTERN.exec(raw);
  CLOCK_TIME_PATTERN.lastIndex = 0;

  if (clockTimeMatch?.[1] && clockTimeMatch[3]) {
    parsedTime = parseClockTime(
      clockTimeMatch[1],
      clockTimeMatch[2],
      clockTimeMatch[3],
    );
    supplementQuery = supplementQuery.replace(clockTimeMatch[0], "").trim();
  }

  // If no clock time, try relative time patterns
  if (!parsedTime) {
    const relativeTimeMatch = RELATIVE_TIME_PATTERN.exec(raw);
    RELATIVE_TIME_PATTERN.lastIndex = 0;

    if (relativeTimeMatch?.[1]) {
      parsedTime = parseRelativeTime(relativeTimeMatch[1]);
      if (parsedTime) {
        supplementQuery = supplementQuery
          .replace(relativeTimeMatch[0], "")
          .trim();
      }
    }
  }

  // Extract time context (legacy - descriptive only, doesn't create a Date)
  let timeContext: string | null = null;
  const timeMatch = TIME_PATTERN.exec(raw);
  TIME_PATTERN.lastIndex = 0;

  if (timeMatch?.[1]) {
    timeContext = timeMatch[1].toLowerCase();
    // Only remove from query if we didn't already parse a specific time
    if (!parsedTime) {
      supplementQuery = supplementQuery.replace(timeMatch[0], "").trim();
    }
  }

  // Clean up supplement query (remove common words)
  supplementQuery = supplementQuery
    .replace(/\b(took|taking|take|log|add|with|at)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    raw,
    supplementQuery,
    dosage,
    quantity,
    timeContext,
    parsedTime,
    isValid: supplementQuery.length > 0,
  };
}

/**
 * Get all aliases for supplements to pass to the semantic search worker
 */
export function getSupplementsWithAliases<
  T extends { id: string; name: string; form: string | null },
>(supplements: T[]): Array<T & { aliases: string[] }> {
  return supplements.map((s) => ({
    ...s,
    aliases: supplementAliases[s.name] ?? [],
  }));
}
