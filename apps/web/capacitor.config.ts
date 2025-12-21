import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor Configuration for Stochi
 *
 * Uses Approach B: Hosted Web View
 * - Points to the deployed web app (https://stochi.app)
 * - Avoids refactoring Server Actions to API routes
 * - Native shell provides push notifications and device APIs
 *
 * For local development, comment out the server block and use:
 * npx cap sync && npx cap open ios/android
 */
const config: CapacitorConfig = {
  appId: "app.stochi.mobile",
  appName: "Stochi",
  webDir: "out", // Static export directory (not used in hosted mode)

  // Hosted web view configuration
  server: {
    // Production URL - the native app loads the web app from this URL
    url: "https://stochi.app",
    // Clear cache on app launch to ensure latest version
    cleartext: false,
  },

  // iOS-specific configuration
  ios: {
    // Enable background modes for push notifications
    // Configured in Xcode: Background Modes -> Remote notifications
    contentInset: "automatic",
    preferredContentMode: "mobile",
    // Scheme for deep linking
    scheme: "stochi",
  },

  // Android-specific configuration
  android: {
    // Allow mixed content for development (disable in production)
    allowMixedContent: false,
    // Use Android WebView with hardware acceleration
    webContentsDebuggingEnabled: false,
  },

  // Plugin configuration
  plugins: {
    PushNotifications: {
      // Presentation options for iOS foreground notifications
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      // Small icon for Android (must be added to android/app/src/main/res)
      smallIcon: "ic_stat_icon_config_sample",
      // Icon color for Android
      iconColor: "#6366f1", // Indigo-500 to match app theme
      // Sound for notifications
      sound: "beep.wav",
    },
  },
};

export default config;
