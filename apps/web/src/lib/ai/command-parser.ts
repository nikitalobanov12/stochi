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

export type ParsedDosage = {
  value: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export type ParsedQuantity = {
  count: number;
  form: string;
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
  /** Time of day if mentioned */
  timeContext: string | null;
  /** Confidence that this is a valid log command */
  isValid: boolean;
};

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

  // Extract time context
  let timeContext: string | null = null;
  const timeMatch = TIME_PATTERN.exec(raw);
  TIME_PATTERN.lastIndex = 0;

  if (timeMatch?.[1]) {
    timeContext = timeMatch[1].toLowerCase();
    supplementQuery = supplementQuery.replace(timeMatch[0], "").trim();
  }

  // Clean up supplement query (remove common words)
  supplementQuery = supplementQuery
    .replace(/\b(took|taking|take|log|add|with)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    raw,
    supplementQuery,
    dosage,
    quantity,
    timeContext,
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
