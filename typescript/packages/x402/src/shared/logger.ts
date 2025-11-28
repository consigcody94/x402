/**
 * Structured logging utility for x402 payment protocol
 *
 * Provides consistent, structured logging across all x402 packages
 * with support for different log levels and contextual metadata.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  component?: string;
  operation?: string;
  network?: string;
  transactionHash?: string;
  payer?: string;
  amount?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}

/**
 * Creates a structured logger instance
 *
 * @param component - The component name for log context
 * @param options - Logger configuration options
 * @returns A structured logger instance
 */
export function createLogger(
  component: string,
  options: {
    minLevel?: LogLevel;
    outputJson?: boolean;
  } = {},
): Logger {
  const { minLevel = "info", outputJson = process.env.NODE_ENV === "production" } = options;

  const levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  function shouldLog(level: LogLevel): boolean {
    return levelOrder[level] >= levelOrder[minLevel];
  }

  function formatEntry(entry: LogEntry): string {
    if (outputJson) {
      return JSON.stringify(entry);
    }

    const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, `[${component}]`, entry.message];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(" ");
  }

  function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { component, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = formatEntry(entry);

    switch (level) {
      case "debug":
      case "info":
        console.log(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  }

  return {
    debug: (message: string, context?: LogContext) => log("debug", message, context),
    info: (message: string, context?: LogContext) => log("info", message, context),
    warn: (message: string, context?: LogContext) => log("warn", message, context),
    error: (message: string, error?: Error, context?: LogContext) => log("error", message, context, error),
  };
}

/**
 * Default logger instance for x402 core operations
 */
export const defaultLogger = createLogger("x402");
