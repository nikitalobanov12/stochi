/**
 * Development-only Logger Utility
 *
 * Logs messages only in development environment to avoid
 * leaking sensitive information in production.
 */

const isDev = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  /** Optional context/module name for the log */
  context?: string;
  /** Additional data to log */
  data?: unknown;
}

function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  const context = options?.context ? `[${options.context}]` : "";
  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${context} ${message}`.trim();
}

/**
 * Logger that only outputs in development environment
 */
export const logger = {
  /**
   * Debug level - verbose information for debugging
   */
  debug(message: string, options?: LogOptions): void {
    if (!isDev) return;
    console.debug(formatMessage("debug", message, options), options?.data ?? "");
  },

  /**
   * Info level - general information
   */
  info(message: string, options?: LogOptions): void {
    if (!isDev) return;
    console.info(formatMessage("info", message, options), options?.data ?? "");
  },

  /**
   * Warn level - warning messages
   */
  warn(message: string, options?: LogOptions): void {
    if (!isDev) return;
    console.warn(formatMessage("warn", message, options), options?.data ?? "");
  },

  /**
   * Error level - error messages (also logs in production for critical issues)
   * Note: Be careful not to log sensitive data in error messages
   */
  error(message: string, options?: LogOptions): void {
    // Errors are logged in all environments, but without sensitive data
    if (isDev) {
      console.error(formatMessage("error", message, options), options?.data ?? "");
    } else {
      // In production, only log the message without potentially sensitive data
      console.error(formatMessage("error", message));
    }
  },

  /**
   * Group related logs together (dev only)
   */
  group(label: string): void {
    if (!isDev) return;
    console.group(label);
  },

  /**
   * End a log group (dev only)
   */
  groupEnd(): void {
    if (!isDev) return;
    console.groupEnd();
  },

  /**
   * Log a table (dev only)
   */
  table(data: unknown): void {
    if (!isDev) return;
    console.table(data);
  },

  /**
   * Time an operation (dev only)
   */
  time(label: string): void {
    if (!isDev) return;
    console.time(label);
  },

  /**
   * End timing an operation (dev only)
   */
  timeEnd(label: string): void {
    if (!isDev) return;
    console.timeEnd(label);
  },
};
