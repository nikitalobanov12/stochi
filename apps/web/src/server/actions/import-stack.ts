"use server";

import { db } from "~/server/db";
import { stack, stackItem } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  supplementAliases,
  fuzzySearchSupplements,
} from "~/server/data/supplement-aliases";

// ============================================================================
// Types
// ============================================================================

export type ParsedItem = {
  rawText: string;
  name: string;
  dosage: number | null;
  unit: string | null;
};

export type MatchedItem = ParsedItem & {
  matched: true;
  supplementId: string;
  supplementName: string;
  resolvedDosage: number;
  resolvedUnit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export type UnmatchedItem = ParsedItem & {
  matched: false;
  suggestions: Array<{ id: string; name: string; score: number }>;
};

export type ParseResult = {
  matched: MatchedItem[];
  unmatched: UnmatchedItem[];
};

// ============================================================================
// Constants
// ============================================================================

const UNIT_NORMALIZATIONS: Record<string, "mg" | "mcg" | "g" | "IU" | "ml"> = {
  mg: "mg",
  milligram: "mg",
  milligrams: "mg",
  mcg: "mcg",
  microgram: "mcg",
  micrograms: "mcg",
  ug: "mcg",
  µg: "mcg",
  g: "g",
  gram: "g",
  grams: "g",
  iu: "IU",
  "i.u.": "IU",
  "international unit": "IU",
  "international units": "IU",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  cc: "ml",
};

// Default dosages when user doesn't provide one (common serving sizes)
const DEFAULT_DOSAGES: Record<
  string,
  { dosage: number; unit: "mg" | "mcg" | "g" | "IU" | "ml" }
> = {
  "Vitamin D3": { dosage: 5000, unit: "IU" },
  "Vitamin K2 MK-7": { dosage: 100, unit: "mcg" },
  "Vitamin C": { dosage: 1000, unit: "mg" },
  "Vitamin B12": { dosage: 1000, unit: "mcg" },
  "Magnesium Glycinate": { dosage: 400, unit: "mg" },
  "Magnesium Citrate": { dosage: 400, unit: "mg" },
  "Magnesium L-Threonate": { dosage: 144, unit: "mg" },
  "Zinc Picolinate": { dosage: 30, unit: "mg" },
  "Fish Oil (EPA)": { dosage: 1000, unit: "mg" },
  "Fish Oil (DHA)": { dosage: 500, unit: "mg" },
  Ashwagandha: { dosage: 600, unit: "mg" },
  "L-Theanine": { dosage: 200, unit: "mg" },
  Caffeine: { dosage: 100, unit: "mg" },
  Creatine: { dosage: 5, unit: "g" },
  "Creatine Monohydrate": { dosage: 5, unit: "g" },
  Melatonin: { dosage: 3, unit: "mg" },
  CoQ10: { dosage: 100, unit: "mg" },
  NAC: { dosage: 600, unit: "mg" },
  "Lion's Mane": { dosage: 500, unit: "mg" },
  "BPC-157": { dosage: 250, unit: "mcg" },
  "TB-500": { dosage: 2, unit: "mg" },
};

// ============================================================================
// Parsing Logic
// ============================================================================

/**
 * Parse raw text input into structured supplement entries.
 * Handles various formats:
 * - "Vitamin D 5000 IU"
 * - "Vitamin D, 5000IU"
 * - "Vitamin D - 5000 IU"
 * - "5000IU Vitamin D"
 * - CSV: "Supplement,Dosage,Unit"
 * - One supplement per line
 */
function parseRawText(text: string): ParsedItem[] {
  const lines = text
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Check if it looks like CSV with header
  const firstLine = lines[0]?.toLowerCase() ?? "";
  const isCSV =
    firstLine.includes("supplement") ||
    firstLine.includes("name") ||
    firstLine.includes(",");

  if (isCSV && lines.length > 1) {
    return parseCSV(lines);
  }

  return lines.map(parseLine);
}

/**
 * Parse CSV format
 */
function parseCSV(lines: string[]): ParsedItem[] {
  const results: ParsedItem[] = [];

  // Try to detect header
  const firstLine = lines[0]!.toLowerCase();
  let startIdx = 0;
  let nameCol = 0;
  let dosageCol = 1;
  let unitCol = 2;

  if (
    firstLine.includes("supplement") ||
    firstLine.includes("name") ||
    firstLine.includes("dosage")
  ) {
    // Has header row
    const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
    nameCol = headers.findIndex(
      (h) => h.includes("name") || h.includes("supplement"),
    );
    dosageCol = headers.findIndex(
      (h) => h.includes("dosage") || h.includes("amount") || h.includes("dose"),
    );
    unitCol = headers.findIndex((h) => h.includes("unit"));
    startIdx = 1;

    if (nameCol === -1) nameCol = 0;
    if (dosageCol === -1) dosageCol = 1;
    if (unitCol === -1) unitCol = 2;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i]!.split(",").map((c) => c.trim());
    const name = cols[nameCol] ?? "";
    const dosageStr = cols[dosageCol] ?? "";
    const unitStr = cols[unitCol] ?? "";

    if (!name) continue;

    const dosage = parseFloat(dosageStr);
    const unit = normalizeUnit(unitStr);

    results.push({
      rawText: lines[i]!,
      name: cleanSupplementName(name),
      dosage: isNaN(dosage) ? null : dosage,
      unit,
    });
  }

  return results;
}

/**
 * Parse a single line of text
 */
function parseLine(line: string): ParsedItem {
  // Remove common separators and clean up
  const cleaned = line
    .replace(/[-–—:]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Regex to match dosage patterns like "5000 IU", "500mg", "2.5 g"
  const dosagePattern =
    /(\d+(?:\.\d+)?)\s*(mg|mcg|ug|µg|g|iu|i\.u\.|ml|cc|milligram|microgram|gram|milliliter)s?\b/i;

  const match = cleaned.match(dosagePattern);

  let name: string;
  let dosage: number | null = null;
  let unit: string | null = null;

  if (match) {
    dosage = parseFloat(match[1]!);
    unit = normalizeUnit(match[2]!);

    // Remove the dosage part from the name
    name = cleaned.replace(dosagePattern, "").trim();
  } else {
    name = cleaned;
  }

  return {
    rawText: line,
    name: cleanSupplementName(name),
    dosage,
    unit,
  };
}

/**
 * Clean up supplement name
 */
function cleanSupplementName(name: string): string {
  return name
    .replace(/^\d+\.\s*/, "") // Remove leading numbers like "1. "
    .replace(/^[-•*]\s*/, "") // Remove bullet points
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize unit string to standard format
 */
function normalizeUnit(unit: string): "mg" | "mcg" | "g" | "IU" | "ml" | null {
  const normalized = unit.toLowerCase().trim();
  return UNIT_NORMALIZATIONS[normalized] ?? null;
}

// ============================================================================
// Matching Logic
// ============================================================================

/**
 * Match parsed items against supplement database
 */
async function matchSupplements(parsed: ParsedItem[]): Promise<ParseResult> {
  // Fetch all supplements from database
  const allSupplements = await db.query.supplement.findMany({
    columns: {
      id: true,
      name: true,
      form: true,
      defaultUnit: true,
    },
  });

  const matched: MatchedItem[] = [];
  const unmatched: UnmatchedItem[] = [];

  for (const item of parsed) {
    if (!item.name) continue;

    // Try fuzzy search
    const results = fuzzySearchSupplements(allSupplements, item.name);
    const bestMatch = results[0];

    // Consider it a match if score is high enough (exact or very close match)
    // We check by seeing if the top result name closely matches
    const isGoodMatch = bestMatch && isCloseMatch(item.name, bestMatch.name);

    if (isGoodMatch && bestMatch) {
      // Resolve dosage and unit
      const defaultDosage = DEFAULT_DOSAGES[bestMatch.name];
      const resolvedDosage = item.dosage ?? defaultDosage?.dosage ?? 100;
      const resolvedUnit =
        (item.unit as "mg" | "mcg" | "g" | "IU" | "ml") ??
        defaultDosage?.unit ??
        bestMatch.defaultUnit ??
        "mg";

      matched.push({
        ...item,
        matched: true,
        supplementId: bestMatch.id,
        supplementName: bestMatch.name,
        resolvedDosage,
        resolvedUnit,
      });
    } else {
      // Add top 3 suggestions for unmatched
      const suggestions = results.slice(0, 3).map((s, idx) => ({
        id: s.id,
        name: s.name,
        score: 100 - idx * 20, // Approximate score for display
      }));

      unmatched.push({
        ...item,
        matched: false,
        suggestions,
      });
    }
  }

  return { matched, unmatched };
}

/**
 * Check if the parsed name is close enough to the matched supplement name
 */
function isCloseMatch(parsedName: string, supplementName: string): boolean {
  const parsed = parsedName.toLowerCase().trim();
  const supp = supplementName.toLowerCase();

  // Exact match
  if (parsed === supp) return true;

  // Supplement name contains the parsed name
  if (supp.includes(parsed) || parsed.includes(supp)) return true;

  // Check against aliases
  const aliases = supplementAliases[supplementName] ?? [];
  if (
    aliases.some(
      (alias) =>
        alias === parsed || alias.includes(parsed) || parsed.includes(alias),
    )
  ) {
    return true;
  }

  // Word matching - if all words in parsed exist in supplement name
  const parsedWords = parsed.split(/\s+/);
  const suppWords = supp.split(/\s+/);
  const allWordsMatch = parsedWords.every((pw) =>
    suppWords.some((sw) => sw.includes(pw) || pw.includes(sw)),
  );
  if (allWordsMatch && parsedWords.length > 0) return true;

  return false;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Parse and match supplements from raw text input.
 * Returns matched and unmatched items for user review.
 */
export async function parseStackImport(text: string): Promise<ParseResult> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  if (!text.trim()) {
    return { matched: [], unmatched: [] };
  }

  const parsed = parseRawText(text);
  return matchSupplements(parsed);
}

/**
 * Create a stack from imported items after user review.
 */
export async function createStackFromImport(
  stackName: string,
  items: Array<{
    supplementId: string;
    dosage: number;
    unit: "mg" | "mcg" | "g" | "IU" | "ml";
  }>,
): Promise<{ success: boolean; stackId?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!stackName.trim()) {
    return { success: false, error: "Stack name is required" };
  }

  if (items.length === 0) {
    return { success: false, error: "No supplements to import" };
  }

  try {
    // Create the stack
    const [newStack] = await db
      .insert(stack)
      .values({
        userId: session.user.id,
        name: stackName.trim(),
      })
      .returning();

    if (!newStack) {
      return { success: false, error: "Failed to create stack" };
    }

    // Add all items
    await db.insert(stackItem).values(
      items.map((item) => ({
        stackId: newStack.id,
        supplementId: item.supplementId,
        dosage: item.dosage,
        unit: item.unit,
      })),
    );

    revalidatePath("/dashboard/stacks");
    revalidatePath("/dashboard");

    return { success: true, stackId: newStack.id };
  } catch (error) {
    console.error("Failed to create stack from import:", error);
    return { success: false, error: "Failed to create stack" };
  }
}
