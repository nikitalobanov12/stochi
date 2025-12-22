/**
 * Local Notification Service for Stochi
 *
 * Provides scheduled local notifications for supplement reminders.
 * Works on both native (iOS/Android) and web (where supported).
 *
 * Usage:
 * ```ts
 * import { localNotifications } from '~/lib/capacitor/local-notifications';
 *
 * // Schedule a reminder
 * await localNotifications.scheduleReminder({
 *   id: 'morning-stack',
 *   title: 'Morning Stack Reminder',
 *   body: 'Time to take your morning supplements',
 *   hour: 8,
 *   minute: 0,
 * });
 *
 * // Cancel a reminder
 * await localNotifications.cancelReminder('morning-stack');
 * ```
 */

import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type LocalNotificationSchema,
  type ScheduleOptions,
} from "@capacitor/local-notifications";

export type ReminderConfig = {
  /** Unique identifier for the reminder */
  id: string;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Hour of day (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Days of week (1-7, 1=Sunday). Empty = every day */
  daysOfWeek?: number[];
  /** Extra data to include */
  extra?: Record<string, unknown>;
};

export type ScheduledReminder = {
  id: string;
  title: string;
  body: string;
  scheduledAt: Date | null;
};

class LocalNotificationService {
  private initialized = false;

  /**
   * Check if running in a native Capacitor environment
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize the local notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.isNative()) {
      // Register action types for interactive notifications
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: "SUPPLEMENT_REMINDER",
            actions: [
              {
                id: "take",
                title: "Log as Taken",
              },
              {
                id: "snooze",
                title: "Snooze 30 min",
              },
            ],
          },
        ],
      });

      // Listen for notification actions
      await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          console.log("[LocalNotifications] Action performed:", action);
          // Handle snooze action
          if (action.actionId === "snooze") {
            this.snoozeReminder(action.notification);
          }
        },
      );
    }

    this.initialized = true;
  }

  /**
   * Request permission for local notifications
   */
  async requestPermission(): Promise<boolean> {
    if (this.isNative()) {
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    }

    // Web fallback
    if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }

    return false;
  }

  /**
   * Schedule a daily reminder
   */
  async scheduleReminder(config: ReminderConfig): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const notificationId = this.stringToId(config.id);

    if (this.isNative()) {
      const schedule: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: config.title,
            body: config.body,
            schedule: {
              on: {
                hour: config.hour,
                minute: config.minute,
              },
              every: "day",
              allowWhileIdle: true,
            },
            actionTypeId: "SUPPLEMENT_REMINDER",
            extra: {
              reminderId: config.id,
              ...config.extra,
            },
          },
        ],
      };

      await LocalNotifications.schedule(schedule);
      console.log(`[LocalNotifications] Scheduled reminder: ${config.id}`);
    } else {
      // Web fallback - store in localStorage for service worker
      const reminders = this.getStoredReminders();
      reminders[config.id] = config;
      localStorage.setItem("stochi_reminders", JSON.stringify(reminders));
      console.log(`[LocalNotifications] Stored web reminder: ${config.id}`);
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(id: string): Promise<void> {
    const notificationId = this.stringToId(id);

    if (this.isNative()) {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }],
      });
      console.log(`[LocalNotifications] Cancelled reminder: ${id}`);
    } else {
      const reminders = this.getStoredReminders();
      delete reminders[id];
      localStorage.setItem("stochi_reminders", JSON.stringify(reminders));
    }
  }

  /**
   * Get all scheduled reminders
   */
  async getScheduledReminders(): Promise<ScheduledReminder[]> {
    if (this.isNative()) {
      const result = await LocalNotifications.getPending();
      return result.notifications.map((n) => ({
        id: (n.extra?.reminderId as string) ?? String(n.id),
        title: n.title ?? "",
        body: n.body ?? "",
        scheduledAt: null, // Schedule info not directly available
      }));
    }

    // Web fallback
    const reminders = this.getStoredReminders();
    return Object.values(reminders).map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      scheduledAt: null,
    }));
  }

  /**
   * Cancel all scheduled reminders
   */
  async cancelAllReminders(): Promise<void> {
    if (this.isNative()) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
    } else {
      localStorage.removeItem("stochi_reminders");
    }
    console.log("[LocalNotifications] Cancelled all reminders");
  }

  /**
   * Snooze a notification for 30 minutes
   */
  private async snoozeReminder(
    notification: LocalNotificationSchema,
  ): Promise<void> {
    const snoozeTime = new Date(Date.now() + 30 * 60 * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notification.id + 1000, // Offset ID for snooze
          title: notification.title ?? "Reminder",
          body: notification.body ?? "",
          schedule: {
            at: snoozeTime,
          },
          extra: notification.extra,
        },
      ],
    });

    console.log(
      `[LocalNotifications] Snoozed until ${snoozeTime.toLocaleTimeString()}`,
    );
  }

  /**
   * Convert string ID to numeric ID (Capacitor requires numeric IDs)
   */
  private stringToId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get stored reminders from localStorage (web fallback)
   */
  private getStoredReminders(): Record<string, ReminderConfig> {
    if (typeof localStorage === "undefined") return {};
    try {
      const stored = localStorage.getItem("stochi_reminders");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Cleanup listeners
   */
  async cleanup(): Promise<void> {
    if (this.isNative()) {
      await LocalNotifications.removeAllListeners();
    }
    this.initialized = false;
  }
}

// Singleton instance
export const localNotifications = new LocalNotificationService();
