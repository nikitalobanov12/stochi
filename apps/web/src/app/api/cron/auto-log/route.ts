import { NextResponse, type NextRequest } from "next/server";
import { eq, isNotNull } from "drizzle-orm";

import { db } from "~/server/db";
import { protocol, log, userPreference } from "~/server/db/schema";
import { env } from "~/env";
import { logger } from "~/lib/logger";

/**
 * Parse time string "HH:MM" to { hours, minutes }
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Get current time in a specific timezone as { hours, minutes }
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
 * Check if current time is within the slot window (slot time ± 30 minutes).
 * This allows for cron timing flexibility.
 */
function isWithinSlotWindow(
  currentHours: number,
  currentMinutes: number,
  slotHours: number,
  slotMinutes: number,
): boolean {
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const slotTotalMinutes = slotHours * 60 + slotMinutes;

  // Window is ±30 minutes around the slot time
  const windowStart = slotTotalMinutes - 30;
  const windowEnd = slotTotalMinutes + 30;

  return currentTotalMinutes >= windowStart && currentTotalMinutes <= windowEnd;
}

/**
 * Determine which time slot should be logged based on current time in timezone.
 * Returns null if no slot is within the logging window.
 */
function determineActiveSlot(
  currentTime: { hours: number; minutes: number },
  slotTimes: {
    morningTime: string;
    afternoonTime: string;
    eveningTime: string;
    bedtimeTime: string;
  },
): "morning" | "afternoon" | "evening" | "bedtime" | null {
  const slots = [
    { name: "morning" as const, time: slotTimes.morningTime },
    { name: "afternoon" as const, time: slotTimes.afternoonTime },
    { name: "evening" as const, time: slotTimes.eveningTime },
    { name: "bedtime" as const, time: slotTimes.bedtimeTime },
  ];

  for (const slot of slots) {
    const slotTime = parseTime(slot.time);
    if (
      isWithinSlotWindow(
        currentTime.hours,
        currentTime.minutes,
        slotTime.hours,
        slotTime.minutes,
      )
    ) {
      return slot.name;
    }
  }

  return null;
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
 * POST /api/cron/auto-log
 *
 * Cron job endpoint that automatically logs protocol items at their scheduled times.
 * Should be called every hour by Vercel Cron.
 *
 * Security: Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Auto-log cron: unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all protocols with auto-log enabled
    const autoLogProtocols = await db.query.protocol.findMany({
      where: eq(protocol.autoLogEnabled, true),
      with: {
        items: true,
        user: {
          columns: { id: true },
        },
      },
    });

    if (autoLogProtocols.length === 0) {
      logger.info("Auto-log cron: no protocols with auto-log enabled");
      return NextResponse.json({
        success: true,
        message: "No protocols with auto-log enabled",
        processed: 0,
        logged: 0,
      });
    }

    // Get user preferences for timezones
    const preferences = await db.query.userPreference.findMany({
      where: isNotNull(userPreference.timezone),
      columns: {
        userId: true,
        timezone: true,
      },
    });

    const timezoneByUserId = new Map(
      preferences.map((p) => [p.userId, p.timezone]),
    );

    let totalLogged = 0;
    let usersProcessed = 0;

    for (const userProtocol of autoLogProtocols) {
      const timezone = timezoneByUserId.get(userProtocol.userId);

      // Skip users without timezone configured
      if (!timezone) {
        logger.debug(`Auto-log: skipping user ${userProtocol.userId} - no timezone`);
        continue;
      }

      // Get current time in user's timezone
      const currentTime = getCurrentTimeInTimezone(timezone);

      // Determine which slot (if any) is active right now
      const activeSlot = determineActiveSlot(currentTime, {
        morningTime: userProtocol.morningTime,
        afternoonTime: userProtocol.afternoonTime,
        eveningTime: userProtocol.eveningTime,
        bedtimeTime: userProtocol.bedtimeTime,
      });

      if (!activeSlot) {
        logger.debug(
          `Auto-log: no active slot for user ${userProtocol.userId} at ${currentTime.hours}:${currentTime.minutes} ${timezone}`,
        );
        continue;
      }

      // Get items for this slot that should be logged today
      const slotItems = userProtocol.items.filter(
        (item) =>
          item.timeSlot === activeSlot &&
          shouldLogItem(item, currentTime.dayOfWeek),
      );

      if (slotItems.length === 0) {
        logger.debug(
          `Auto-log: no items to log for ${activeSlot} slot for user ${userProtocol.userId}`,
        );
        continue;
      }

      // Create log entries
      const logTime = new Date();
      const logEntries = slotItems.map((item) => ({
        userId: userProtocol.userId,
        supplementId: item.supplementId,
        dosage: item.dosage,
        unit: item.unit,
        loggedAt: logTime,
      }));

      await db.insert(log).values(logEntries);

      totalLogged += slotItems.length;
      usersProcessed++;

      logger.info(
        `Auto-log: logged ${slotItems.length} items for user ${userProtocol.userId} (${activeSlot} slot)`,
      );
    }

    logger.info(
      `Auto-log cron completed: ${usersProcessed} users, ${totalLogged} items logged`,
    );

    return NextResponse.json({
      success: true,
      processed: usersProcessed,
      logged: totalLogged,
    });
  } catch (error) {
    logger.error("Auto-log cron error", { data: error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Also support POST for flexibility
export { GET as POST };
