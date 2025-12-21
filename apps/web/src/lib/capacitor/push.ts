/**
 * Push Notification Service for Stochi
 *
 * Provides a unified interface for push notifications across platforms:
 * - Native (iOS/Android): Uses Capacitor Push Notifications plugin
 * - Web: Falls back to Web Push API (service worker)
 *
 * Usage:
 * ```ts
 * import { pushService } from '~/lib/capacitor/push';
 *
 * // Initialize (call once on app mount)
 * await pushService.initialize();
 *
 * // Check permission status
 * const status = await pushService.getPermissionStatus();
 *
 * // Request permission
 * const granted = await pushService.requestPermission();
 *
 * // Get device token for backend registration
 * const token = await pushService.getToken();
 * ```
 */

import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from "@capacitor/push-notifications";

export type PushPermissionStatus = "granted" | "denied" | "prompt";

export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushNotificationHandler = (
  notification: PushNotificationPayload,
) => void;
export type PushActionHandler = (
  actionId: string,
  notification: PushNotificationPayload,
) => void;

class PushNotificationService {
  private initialized = false;
  private token: string | null = null;
  private notificationHandlers: PushNotificationHandler[] = [];
  private actionHandlers: PushActionHandler[] = [];

  /**
   * Check if running in a native Capacitor environment
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize the push notification service.
   * Must be called before any other methods.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.isNative()) {
      await this.initializeNative();
    } else {
      await this.initializeWeb();
    }

    this.initialized = true;
  }

  /**
   * Initialize native push notifications (iOS/Android)
   */
  private async initializeNative(): Promise<void> {
    // Register event listeners
    await PushNotifications.addListener("registration", (token: Token) => {
      console.log("[Push] Registered with token:", token.value);
      this.token = token.value;
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("[Push] Registration error:", error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("[Push] Notification received:", notification);
        this.handleNotification({
          title: notification.title ?? "",
          body: notification.body ?? "",
          data: notification.data,
        });
      },
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        console.log("[Push] Action performed:", action);
        this.handleAction(action.actionId, {
          title: action.notification.title ?? "",
          body: action.notification.body ?? "",
          data: action.notification.data,
        });
      },
    );
  }

  /**
   * Initialize web push notifications (fallback)
   */
  private async initializeWeb(): Promise<void> {
    // Web Push initialization would go here
    // For now, we just log that web push is not yet implemented
    console.log("[Push] Web push not implemented - using PWA notifications");
  }

  /**
   * Get the current permission status
   */
  async getPermissionStatus(): Promise<PushPermissionStatus> {
    if (this.isNative()) {
      const result = await PushNotifications.checkPermissions();
      switch (result.receive) {
        case "granted":
          return "granted";
        case "denied":
          return "denied";
        default:
          return "prompt";
      }
    }

    // Web fallback
    if (typeof Notification !== "undefined") {
      switch (Notification.permission) {
        case "granted":
          return "granted";
        case "denied":
          return "denied";
        default:
          return "prompt";
      }
    }

    return "denied";
  }

  /**
   * Request permission to send push notifications
   * @returns true if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    if (this.isNative()) {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === "granted") {
        // Register with APNs/FCM
        await PushNotifications.register();
        return true;
      }
      return false;
    }

    // Web fallback
    if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }

    return false;
  }

  /**
   * Get the device push token for backend registration
   * @returns Push token or null if not available
   */
  async getToken(): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    // For native, token is set during registration callback
    if (this.isNative()) {
      return this.token;
    }

    // Web push would return a subscription endpoint
    return null;
  }

  /**
   * Register a handler for incoming notifications
   */
  onNotification(handler: PushNotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Register a handler for notification actions (user taps)
   */
  onAction(handler: PushActionHandler): () => void {
    this.actionHandlers.push(handler);
    return () => {
      this.actionHandlers = this.actionHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Handle an incoming notification
   */
  private handleNotification(notification: PushNotificationPayload): void {
    for (const handler of this.notificationHandlers) {
      try {
        handler(notification);
      } catch (error) {
        console.error("[Push] Notification handler error:", error);
      }
    }
  }

  /**
   * Handle a notification action
   */
  private handleAction(
    actionId: string,
    notification: PushNotificationPayload,
  ): void {
    for (const handler of this.actionHandlers) {
      try {
        handler(actionId, notification);
      } catch (error) {
        console.error("[Push] Action handler error:", error);
      }
    }
  }

  /**
   * Remove all listeners and reset state
   */
  async cleanup(): Promise<void> {
    if (this.isNative()) {
      await PushNotifications.removeAllListeners();
    }
    this.initialized = false;
    this.token = null;
    this.notificationHandlers = [];
    this.actionHandlers = [];
  }
}

// Singleton instance
export const pushService = new PushNotificationService();
