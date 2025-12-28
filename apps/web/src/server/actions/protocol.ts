"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import {
  protocol,
  protocolItem,
  log,
  type timeSlotEnum,
  type frequencyEnum,
  type dosageUnitEnum,
} from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

// Type definitions
type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type Frequency = (typeof frequencyEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

const VALID_TIME_SLOTS: TimeSlot[] = ["morning", "afternoon", "evening", "bedtime"];
const VALID_FREQUENCIES: Frequency[] = ["daily", "specific_days", "as_needed"];
const VALID_UNITS: DosageUnit[] = ["mg", "mcg", "g", "IU", "ml"];
const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayOfWeek = (typeof VALID_DAYS)[number];

// Validation helpers
function isValidTimeSlot(slot: unknown): slot is TimeSlot {
  return typeof slot === "string" && VALID_TIME_SLOTS.includes(slot as TimeSlot);
}

function isValidFrequency(freq: unknown): freq is Frequency {
  return typeof freq === "string" && VALID_FREQUENCIES.includes(freq as Frequency);
}

function isValidUnit(unit: unknown): unit is DosageUnit {
  return typeof unit === "string" && VALID_UNITS.includes(unit as DosageUnit);
}

function isValidDaysArray(days: unknown): days is DayOfWeek[] {
  if (!Array.isArray(days)) return false;
  return days.every((d) => typeof d === "string" && VALID_DAYS.includes(d as DayOfWeek));
}

function isValidTimeFormat(time: string): boolean {
  // HH:MM format (24-hour)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// ============================================================================
// Protocol CRUD
// ============================================================================

export type ProtocolWithItems = Awaited<ReturnType<typeof getProtocol>>;
export type ProtocolItemWithSupplement = NonNullable<ProtocolWithItems>["items"][number];

/**
 * Get or create the user's protocol.
 * Each user has exactly one protocol.
 */
export async function getProtocol() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    with: {
      items: {
        with: {
          supplement: true,
        },
        orderBy: (items, { asc }) => [asc(items.timeSlot), asc(items.sortOrder)],
      },
    },
  });

  return userProtocol ?? null;
}

/**
 * Create a protocol for the current user.
 * No-op if protocol already exists.
 */
export async function createProtocol(name?: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Check if protocol already exists
  const existing = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    columns: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const [newProtocol] = await db
    .insert(protocol)
    .values({
      userId: session.user.id,
      name: name ?? "My Protocol",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!newProtocol) {
    throw new Error("Failed to create protocol");
  }

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");

  return newProtocol?.id;
}

/**
 * Get or create the user's protocol (convenience function).
 */
export async function getOrCreateProtocol() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  let userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    with: {
      items: {
        with: {
          supplement: true,
        },
        orderBy: (items, { asc }) => [asc(items.timeSlot), asc(items.sortOrder)],
      },
    },
  });

  if (!userProtocol) {
    const [newProtocol] = await db
      .insert(protocol)
      .values({
        userId: session.user.id,
        name: "My Protocol",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newProtocol) {
      throw new Error("Failed to create protocol");
    }

    userProtocol = { ...newProtocol, items: [] };
  }

  return userProtocol;
}

/**
 * Update protocol settings (name, times, auto-log).
 */
export async function updateProtocol(settings: {
  name?: string;
  autoLogEnabled?: boolean;
  morningTime?: string;
  afternoonTime?: string;
  eveningTime?: string;
  bedtimeTime?: string;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Validate time formats
  const timeFields = ["morningTime", "afternoonTime", "eveningTime", "bedtimeTime"] as const;
  for (const field of timeFields) {
    if (settings[field] !== undefined && !isValidTimeFormat(settings[field]!)) {
      throw new Error(`Invalid time format for ${field}. Use HH:MM (24-hour format).`);
    }
  }

  await db
    .update(protocol)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(eq(protocol.userId, session.user.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");
}

// ============================================================================
// Protocol Item CRUD
// ============================================================================

export interface AddProtocolItemInput {
  supplementId: string;
  dosage: number;
  unit: string;
  timeSlot: string;
  frequency?: string;
  daysOfWeek?: string[];
  groupName?: string | null;
}

/**
 * Add a supplement to the user's protocol.
 */
export async function addProtocolItem(input: AddProtocolItemInput) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Validate inputs
  if (!isValidUnit(input.unit)) {
    throw new Error(`Invalid unit: ${input.unit}`);
  }
  if (!isValidTimeSlot(input.timeSlot)) {
    throw new Error(`Invalid time slot: ${input.timeSlot}`);
  }
  if (!Number.isFinite(input.dosage) || input.dosage <= 0) {
    throw new Error("Dosage must be a positive number");
  }

  const frequency = input.frequency ?? "daily";
  if (!isValidFrequency(frequency)) {
    throw new Error(`Invalid frequency: ${frequency}`);
  }

  // Validate days of week if frequency is specific_days
  if (frequency === "specific_days") {
    if (!input.daysOfWeek || input.daysOfWeek.length === 0) {
      throw new Error("Days of week required when frequency is specific_days");
    }
    if (!isValidDaysArray(input.daysOfWeek)) {
      throw new Error("Invalid days of week");
    }
  }

  // Verify supplement exists
  const supplement = await db.query.supplement.findFirst({
    where: (s, { eq }) => eq(s.id, input.supplementId),
    columns: { id: true },
  });

  if (!supplement) {
    throw new Error("Supplement not found");
  }

  // Get or create protocol
  const userProtocol = await getOrCreateProtocol();

  // Get max sort order for this time slot
  const existingItems = await db.query.protocolItem.findMany({
    where: and(
      eq(protocolItem.protocolId, userProtocol.id),
      eq(protocolItem.timeSlot, input.timeSlot as TimeSlot)
    ),
    columns: { sortOrder: true },
  });

  const maxSortOrder = existingItems.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    -1
  );

  await db.insert(protocolItem).values({
    protocolId: userProtocol.id,
    supplementId: input.supplementId,
    dosage: input.dosage,
    unit: input.unit as DosageUnit,
    timeSlot: input.timeSlot as TimeSlot,
    frequency: frequency as Frequency,
    daysOfWeek: frequency === "specific_days" ? input.daysOfWeek : null,
    groupName: input.groupName ?? null,
    sortOrder: maxSortOrder + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, userProtocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");
}

/**
 * Add multiple supplements to the protocol at once.
 */
export async function addProtocolItems(items: AddProtocolItemInput[]) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  if (items.length === 0) {
    return;
  }

  // Validate all items
  for (const item of items) {
    if (!isValidUnit(item.unit)) {
      throw new Error(`Invalid unit: ${item.unit}`);
    }
    if (!isValidTimeSlot(item.timeSlot)) {
      throw new Error(`Invalid time slot: ${item.timeSlot}`);
    }
    if (!Number.isFinite(item.dosage) || item.dosage <= 0) {
      throw new Error("Dosage must be a positive number");
    }
    const frequency = item.frequency ?? "daily";
    if (!isValidFrequency(frequency)) {
      throw new Error(`Invalid frequency: ${frequency}`);
    }
    if (frequency === "specific_days" && !isValidDaysArray(item.daysOfWeek)) {
      throw new Error("Invalid days of week");
    }
  }

  // Verify all supplements exist
  const supplementIds = items.map((i) => i.supplementId);
  const existingSupplements = await db.query.supplement.findMany({
    where: (s, { inArray }) => inArray(s.id, supplementIds),
    columns: { id: true },
  });

  if (existingSupplements.length !== new Set(supplementIds).size) {
    throw new Error("One or more supplements not found");
  }

  // Get or create protocol
  const userProtocol = await getOrCreateProtocol();

  // Get current max sort orders per time slot
  const existingItems = await db.query.protocolItem.findMany({
    where: eq(protocolItem.protocolId, userProtocol.id),
    columns: { timeSlot: true, sortOrder: true },
  });

  const sortOrderBySlot = new Map<string, number>();
  for (const item of existingItems) {
    const current = sortOrderBySlot.get(item.timeSlot) ?? -1;
    sortOrderBySlot.set(item.timeSlot, Math.max(current, item.sortOrder));
  }

  // Build values with incremental sort orders
  const values = items.map((item) => {
    const frequency = (item.frequency ?? "daily") as Frequency;
    const currentMax = sortOrderBySlot.get(item.timeSlot) ?? -1;
    const newSortOrder = currentMax + 1;
    sortOrderBySlot.set(item.timeSlot, newSortOrder);

    return {
      protocolId: userProtocol.id,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit as DosageUnit,
      timeSlot: item.timeSlot as TimeSlot,
      frequency,
      daysOfWeek: frequency === "specific_days" ? item.daysOfWeek : null,
      groupName: item.groupName ?? null,
      sortOrder: newSortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  await db.insert(protocolItem).values(values);

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, userProtocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");
}

/**
 * Update a protocol item.
 */
export async function updateProtocolItem(
  itemId: string,
  updates: {
    dosage?: number;
    unit?: string;
    timeSlot?: string;
    frequency?: string;
    daysOfWeek?: string[];
    groupName?: string | null;
    sortOrder?: number;
  }
) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Validate updates
  if (updates.unit !== undefined && !isValidUnit(updates.unit)) {
    throw new Error(`Invalid unit: ${updates.unit}`);
  }
  if (updates.timeSlot !== undefined && !isValidTimeSlot(updates.timeSlot)) {
    throw new Error(`Invalid time slot: ${updates.timeSlot}`);
  }
  if (updates.frequency !== undefined && !isValidFrequency(updates.frequency)) {
    throw new Error(`Invalid frequency: ${updates.frequency}`);
  }
  if (updates.dosage !== undefined && (!Number.isFinite(updates.dosage) || updates.dosage <= 0)) {
    throw new Error("Dosage must be a positive number");
  }
  if (updates.daysOfWeek !== undefined && !isValidDaysArray(updates.daysOfWeek)) {
    throw new Error("Invalid days of week");
  }

  // Verify item belongs to user
  const item = await db.query.protocolItem.findFirst({
    where: eq(protocolItem.id, itemId),
    with: {
      protocol: {
        columns: { userId: true, id: true },
      },
    },
  });

  if (!item?.protocol || item.protocol.userId !== session.user.id) {
    throw new Error("Item not found");
  }

  // Build update object
  const updateData: Partial<typeof protocolItem.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.dosage !== undefined) updateData.dosage = updates.dosage;
  if (updates.unit !== undefined) updateData.unit = updates.unit as DosageUnit;
  if (updates.timeSlot !== undefined) updateData.timeSlot = updates.timeSlot as TimeSlot;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency as Frequency;
  if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;
  if (updates.groupName !== undefined) updateData.groupName = updates.groupName;
  
  // Handle daysOfWeek - only set if frequency is specific_days
  if (updates.daysOfWeek !== undefined) {
    const freq = updates.frequency ?? item.frequency;
    updateData.daysOfWeek = freq === "specific_days" ? updates.daysOfWeek : null;
  }

  await db
    .update(protocolItem)
    .set(updateData)
    .where(eq(protocolItem.id, itemId));

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, item.protocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");
}

/**
 * Remove a supplement from the protocol.
 */
export async function removeProtocolItem(itemId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const item = await db.query.protocolItem.findFirst({
    where: eq(protocolItem.id, itemId),
    with: {
      protocol: {
        columns: { userId: true, id: true },
      },
    },
  });

  if (!item?.protocol || item.protocol.userId !== session.user.id) {
    throw new Error("Item not found");
  }

  await db.delete(protocolItem).where(eq(protocolItem.id, itemId));

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, item.protocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");
}

// ============================================================================
// Protocol Logging
// ============================================================================

/**
 * Log all items in a time slot (e.g., "Log Morning Stack").
 * Respects frequency settings (skips items not scheduled for today).
 */
export async function logProtocolSlot(timeSlot: TimeSlot, loggedAt?: Date) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!isValidTimeSlot(timeSlot)) {
    throw new Error(`Invalid time slot: ${timeSlot}`);
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    with: {
      items: {
        where: eq(protocolItem.timeSlot, timeSlot),
      },
    },
  });

  if (!userProtocol) {
    throw new Error("Protocol not found");
  }

  if (userProtocol.items.length === 0) {
    throw new Error(`No items in ${timeSlot} slot`);
  }

  // Filter items by today's day of week
  const today = new Date();
  // getDay(): Sunday=0, Monday=1, ..., Saturday=6
  // We want: Monday=0, ..., Sunday=6
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const dayOfWeek = VALID_DAYS[dayIndex]!; // Convert to monday=0

  const itemsToLog = userProtocol.items.filter((item) => {
    if (item.frequency === "as_needed") {
      return false; // Skip as-needed items in bulk logging
    }
    if (item.frequency === "specific_days") {
      return item.daysOfWeek?.includes(dayOfWeek) ?? false;
    }
    return true; // daily
  });

  if (itemsToLog.length === 0) {
    throw new Error(`No items scheduled for ${timeSlot} today`);
  }

  // Validate loggedAt
  const logTime = loggedAt ?? new Date();
  const maxFutureTime = new Date(Date.now() + 60 * 1000);
  if (logTime > maxFutureTime) {
    throw new Error("Cannot log supplements in the future");
  }
  const minPastTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (logTime < minPastTime) {
    throw new Error("Cannot log supplements more than 7 days in the past");
  }

  // Insert log entries
  await db.insert(log).values(
    itemsToLog.map((item) => ({
      userId: session.user.id,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      loggedAt: logTime,
    }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/log");
  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");

  return { logged: itemsToLog.length };
}

/**
 * Log a single protocol item (for as-needed items or individual logging).
 */
export async function logProtocolItem(itemId: string, loggedAt?: Date) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const item = await db.query.protocolItem.findFirst({
    where: eq(protocolItem.id, itemId),
    with: {
      protocol: {
        columns: { userId: true },
      },
    },
  });

  if (!item?.protocol || item.protocol.userId !== session.user.id) {
    throw new Error("Item not found");
  }

  // Validate loggedAt
  const logTime = loggedAt ?? new Date();
  const maxFutureTime = new Date(Date.now() + 60 * 1000);
  if (logTime > maxFutureTime) {
    throw new Error("Cannot log supplements in the future");
  }
  const minPastTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (logTime < minPastTime) {
    throw new Error("Cannot log supplements more than 7 days in the past");
  }

  await db.insert(log).values({
    userId: session.user.id,
    supplementId: item.supplementId,
    dosage: item.dosage,
    unit: item.unit,
    loggedAt: logTime,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/log");
  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
}

/**
 * Log entire protocol (all time slots scheduled for today).
 */
export async function logEntireProtocol(loggedAt?: Date) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    with: {
      items: true,
    },
  });

  if (!userProtocol || userProtocol.items.length === 0) {
    throw new Error("Protocol has no items");
  }

  // Filter items by today's day of week
  const today = new Date();
  // getDay(): Sunday=0, Monday=1, ..., Saturday=6
  // We want: Monday=0, ..., Sunday=6
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const dayOfWeek = VALID_DAYS[dayIndex]!;

  const itemsToLog = userProtocol.items.filter((item) => {
    if (item.frequency === "as_needed") {
      return false;
    }
    if (item.frequency === "specific_days") {
      return item.daysOfWeek?.includes(dayOfWeek) ?? false;
    }
    return true;
  });

  if (itemsToLog.length === 0) {
    throw new Error("No items scheduled for today");
  }

  // Validate loggedAt
  const logTime = loggedAt ?? new Date();
  const maxFutureTime = new Date(Date.now() + 60 * 1000);
  if (logTime > maxFutureTime) {
    throw new Error("Cannot log supplements in the future");
  }
  const minPastTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (logTime < minPastTime) {
    throw new Error("Cannot log supplements more than 7 days in the past");
  }

  await db.insert(log).values(
    itemsToLog.map((item) => ({
      userId: session.user.id,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      loggedAt: logTime,
    }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/log");
  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");

  return { logged: itemsToLog.length };
}

// ============================================================================
// Group Management
// ============================================================================

/**
 * Update group name for multiple items (rename a group).
 */
export async function renameProtocolGroup(oldName: string, newName: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    columns: { id: true },
  });

  if (!userProtocol) {
    throw new Error("Protocol not found");
  }

  await db
    .update(protocolItem)
    .set({ groupName: newName.trim() || null, updatedAt: new Date() })
    .where(
      and(
        eq(protocolItem.protocolId, userProtocol.id),
        eq(protocolItem.groupName, oldName)
      )
    );

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, userProtocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
}

/**
 * Remove group name from items (ungroup).
 */
export async function ungroupProtocolItems(groupName: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    columns: { id: true },
  });

  if (!userProtocol) {
    throw new Error("Protocol not found");
  }

  await db
    .update(protocolItem)
    .set({ groupName: null, updatedAt: new Date() })
    .where(
      and(
        eq(protocolItem.protocolId, userProtocol.id),
        eq(protocolItem.groupName, groupName)
      )
    );

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, userProtocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
}

// ============================================================================
// Stack Import
// ============================================================================

/**
 * Import all items from a stack into a protocol time slot.
 * Uses each supplement's suggestedFrequency if set, otherwise defaults to "daily".
 * Groups items under the stack name.
 * Skips supplements already in the protocol.
 */
export async function addStackToProtocol(
  stackId: string,
  timeSlot: string,
): Promise<{ added: number; skipped: number }> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!isValidTimeSlot(timeSlot)) {
    throw new Error(`Invalid time slot: ${timeSlot}`);
  }

  // Fetch the stack with its items
  const userStack = await db.query.stack.findFirst({
    where: (s, { eq, and }) =>
      and(eq(s.id, stackId), eq(s.userId, session.user.id)),
    with: {
      items: {
        with: {
          supplement: {
            columns: {
              id: true,
              name: true,
              suggestedFrequency: true,
            },
          },
        },
      },
    },
  });

  if (!userStack) {
    throw new Error("Stack not found");
  }

  if (userStack.items.length === 0) {
    throw new Error("Stack has no items");
  }

  // Get or create protocol
  const userProtocol = await getOrCreateProtocol();

  // Get existing supplement IDs in protocol to skip duplicates
  const existingSupplementIds = new Set(
    userProtocol.items.map((item) => item.supplementId),
  );

  // Filter out items already in protocol
  const itemsToAdd = userStack.items.filter(
    (item) => !existingSupplementIds.has(item.supplementId),
  );

  if (itemsToAdd.length === 0) {
    return { added: 0, skipped: userStack.items.length };
  }

  // Get current max sort order for this slot
  const existingItems = await db.query.protocolItem.findMany({
    where: and(
      eq(protocolItem.protocolId, userProtocol.id),
      eq(protocolItem.timeSlot, timeSlot as TimeSlot),
    ),
    columns: { sortOrder: true },
  });

  let currentSortOrder = existingItems.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    -1,
  );

  // Build protocol items from stack items
  const protocolItems = itemsToAdd.map((stackItem) => {
    currentSortOrder += 1;

    // Use supplement's suggested frequency if set, otherwise default to daily
    const frequency: Frequency =
      stackItem.supplement.suggestedFrequency ?? "daily";

    return {
      protocolId: userProtocol.id,
      supplementId: stackItem.supplementId,
      dosage: stackItem.dosage,
      unit: stackItem.unit,
      timeSlot: timeSlot as TimeSlot,
      frequency,
      daysOfWeek: null, // For specific_days, user can edit later
      groupName: userStack.name,
      sortOrder: currentSortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  await db.insert(protocolItem).values(protocolItems);

  await db
    .update(protocol)
    .set({ updatedAt: new Date() })
    .where(eq(protocol.id, userProtocol.id));

  revalidatePath("/dashboard/protocol");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard");

  return {
    added: itemsToAdd.length,
    skipped: userStack.items.length - itemsToAdd.length,
  };
}

/**
 * Get all unique group names in the protocol.
 */
export async function getProtocolGroups(): Promise<string[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const userProtocol = await db.query.protocol.findFirst({
    where: eq(protocol.userId, session.user.id),
    with: {
      items: {
        columns: { groupName: true },
      },
    },
  });

  if (!userProtocol) {
    return [];
  }

  const groups = new Set<string>();
  for (const item of userProtocol.items) {
    if (item.groupName) {
      groups.add(item.groupName);
    }
  }

  return Array.from(groups).sort();
}
