/**
 * Structured logging utility for utils.live
 *
 * Provides consistent log formatting across the application.
 * In development, logs are formatted for readability.
 * In production, logs are JSON-formatted for log aggregation services.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown> | undefined;
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === "development") {
    // Human-readable format for development
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
  }

  // JSON format for production (easier to parse by log aggregators)
  return JSON.stringify(entry);
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export const logger = {
  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "development") return;
    // eslint-disable-next-line no-console
    console.debug(formatLog(createLogEntry("debug", message, context)));
  },

  /**
   * Info level logging - general information
   */
  info(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.info(formatLog(createLogEntry("info", message, context)));
  },

  /**
   * Warning level logging - potential issues
   */
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(formatLog(createLogEntry("warn", message, context)));
  },

  /**
   * Error level logging - errors and exceptions
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;
    console.error(formatLog(createLogEntry("error", message, errorContext)));
  },
};
