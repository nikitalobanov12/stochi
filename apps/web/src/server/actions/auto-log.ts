"use server";

import { eq, and, gte } from "drizzle-orm";

import { db } from "~/server/db";
import { protocol, log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { getUserTimezone } from "~/server/actions/preferences";
import { getStartOfDayInTimezone } from "~/lib/utils";
import { logger } from "~/lib/logger";

/**
 * Parse time string "HH:MM" to { hours, minutes }
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Get current time in a specific timezone as { hours, minutes, dayOfWeek }
 */
function getCurrentTimeInTimezone(timezone: string): {
  hours: number;
  minutes: number;
  dayOfWeek: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    weekday: "long",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  const weekdayPart = parts.find((p) => p.type === "weekday");

  return {
    hours: parseInt(hourPart?.value ?? "0", 10),
    minutes: parseInt(minutePart?.value ?? "0", 10),
    dayOfWeek: (weekdayPart?.value ?? "monday").toLowerCase(),
  };
}

/**
 * Check if current time has passed the slot time (with 5 min grace period).
 */
function hasPassedSlotTime(
  currentHours: number,
  currentMinutes: number,
  slotHours: number,
  slotMinutes: number,
): boolean {
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const slotTotalMinutes = slotHours * 60 + slotMinutes;

  // Allow 5 minutes before slot time as grace period
  return currentTotalMinutes >= slotTotalMinutes - 5;
}

/**
 * Determine which time slots should be logged based on current time.
 * Returns all slots that have passed and should be auto-logged.
 */
function getPassedSlots(
  currentTime: { hours: number; minutes: number },
  slotTimes: {
    morningTime: string;
    afternoonTime: string;
    eveningTime: string;
    bedtimeTime: string;
  },
): Array<"morning" | "afternoon" | "evening" | "bedtime"> {
  const slots = [
    { name: "morning" as const, time: slotTimes.morningTime },
    { name: "afternoon" as const, time: slotTimes.afternoonTime },
    { name: "evening" as const, time: slotTimes.eveningTime },
    { name: "bedtime" as const, time: slotTimes.bedtimeTime },
  ];

  const passedSlots: Array<"morning" | "afternoon" | "evening" | "bedtime"> =
    [];

  for (const slot of slots) {
    const slotTime = parseTime(slot.time);
    if (
      hasPassedSlotTime(
        currentTime.hours,
        currentTime.minutes,
        slotTime.hours,
        slotTime.minutes,
      )
    ) {
      passedSlots.push(slot.name);
    }
  }

  return passedSlots;
}

/**
 * Check if an item should be logged based on its frequency settings.
 */
function shouldLogItem(
  item: {
    frequency: string;
    daysOfWeek: string[] | null;
  },
  dayOfWeek: string,
): boolean {
  if (item.frequency === "as_needed") {
    return false; // Never auto-log as-needed items
  }

  if (item.frequency === "specific_days") {
    return item.daysOfWeek?.includes(dayOfWeek) ?? false;
  }

  return true; // daily frequency
}

/**
 * Trigger auto-log for the current user on app open.
 * Logs any protocol items for time slots that have passed today,
 * but only if they haven't already been logged today.
 *
 * Returns the number of items logged.
 */
export async function triggerAutoLog(): Promise<{
  success: boolean;
  logged: number;
  message?: string;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, logged: 0, message: "Not authenticated" };
  }

  try {
    // Get user's protocol with auto-log enabled
    const userProtocol = await db.query.protocol.findFirst({
      where: and(
        eq(protocol.userId, session.user.id),
        eq(protocol.autoLogEnabled, true),
      ),
      with: {
        items: {
          with: {
            supplement: {
              columns: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!userProtocol) {
      return { success: true, logged: 0, message: "Auto-log not enabled" };
    }

    if (userProtocol.items.length === 0) {
      return { success: true, logged: 0, message: "No protocol items" };
    }

    // Get user's timezone
    const timezone = (await getUserTimezone()) ?? "UTC";
    const currentTime = getCurrentTimeInTimezone(timezone);
    const todayStart = getStartOfDayInTimezone(timezone);

    // Get all slots that have passed today
    const passedSlots = getPassedSlots(currentTime, {
      morningTime: userProtocol.morningTime,
      afternoonTime: userProtocol.afternoonTime,
      eveningTime: userProtocol.eveningTime,
      bedtimeTime: userProtocol.bedtimeTime,
    });

    if (passedSlots.length === 0) {
      return { success: true, logged: 0, message: "No slots passed yet" };
    }

    // Get today's existing logs for this user
    const todaysLogs = await db.query.log.findMany({
      where: and(
        eq(log.userId, session.user.id),
        gte(log.loggedAt, todayStart),
      ),
      columns: {
        supplementId: true,
      },
    });

    const loggedSupplementIds = new Set(todaysLogs.map((l) => l.supplementId));

    // Filter items that should be logged (passed slots, correct day, not already logged)
    const itemsToLog = userProtocol.items.filter(
      (item) =>
        passedSlots.includes(item.timeSlot) &&
        shouldLogItem(item, currentTime.dayOfWeek) &&
        !loggedSupplementIds.has(item.supplementId),
    );

    if (itemsToLog.length === 0) {
      return {
        success: true,
        logged: 0,
        message: "All items already logged",
      };
    }

    // Create log entries
    const logTime = new Date();
    const logEntries = itemsToLog.map((item) => ({
      userId: session.user.id,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      loggedAt: logTime,
    }));

    await db.insert(log).values(logEntries);

    logger.info(
      `Auto-log: logged ${itemsToLog.length} items for user ${session.user.id}`,
    );

    return {
      success: true,
      logged: itemsToLog.length,
    };
  } catch (error) {
    logger.error("Auto-log error", { data: error });
    return {
      success: false,
      logged: 0,
      message: "Failed to auto-log",
    };
  }
}
