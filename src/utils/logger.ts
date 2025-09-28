/**
 * Logger Utility Module
 *
 * This module provides a centralized logging utility with different
 * log levels and timestamp formatting. It offers a consistent
 * logging interface throughout the application.
 */

/**
 * Logger Interface
 *
 * Defines the structure of the logger object with different
 * logging methods for various log levels.
 */
interface Logger {
  /** Log informational messages */
  info: (message: string, ...args: any[]) => void;
  /** Log error messages */
  error: (message: string, ...args: any[]) => void;
  /** Log warning messages */
  warn: (message: string, ...args: any[]) => void;
  /** Log debug messages (development only) */
  debug: (message: string, ...args: any[]) => void;
}

/**
 * Logger Implementation
 *
 * Provides structured logging with timestamps and different log levels.
 * Debug logging is only enabled in development environment.
 */
const logger: Logger = {
  /**
   * Log informational messages
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log error messages
   * @param message - The error message to log
   * @param args - Additional arguments to log
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log warning messages
   * @param message - The warning message to log
   * @param args - Additional arguments to log
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log debug messages (only in development environment)
   * @param message - The debug message to log
   * @param args - Additional arguments to log
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        ...args
      );
    }
  },
};

// Export the logger instance
export { logger };
