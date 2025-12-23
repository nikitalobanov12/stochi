/**
 * Retry utility with exponential backoff for optimistic UI patterns.
 *
 * Behavior:
 * - Attempt 1: immediate
 * - Attempt 2: wait baseDelayMs (1s default)
 * - Attempt 3: wait baseDelayMs * 2 (2s default)
 * - If all attempts fail OR timeoutMs elapsed: return failure
 */

export type RetryResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

export type RetryOptions = {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms between retries (default: 1000) */
  baseDelayMs?: number;
  /** Total timeout in ms before giving up (default: 15000) */
  timeoutMs?: number;
};

/**
 * Execute a function with retry and exponential backoff.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns RetryResult with success/failure status
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(() => deleteLog(logId));
 * if (!result.success) {
 *   toast.error("Failed to delete");
 *   router.refresh(); // Sync with server
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<RetryResult<T>> {
  const { maxAttempts = 3, baseDelayMs = 1000, timeoutMs = 15000 } = options ?? {};
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check if we've exceeded the timeout
    if (Date.now() - startTime > timeoutMs) {
      return {
        success: false,
        error: new Error(`Timeout exceeded after ${timeoutMs}ms`),
      };
    }

    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;

      if (isLastAttempt) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s...
      const delay = baseDelayMs * Math.pow(2, attempt - 1);

      // Don't wait if it would exceed timeout
      const remainingTime = timeoutMs - (Date.now() - startTime);
      if (delay > remainingTime) {
        return {
          success: false,
          error: new Error(`Timeout would be exceeded during retry delay`),
        };
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    success: false,
    error: new Error("Max attempts exceeded"),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
