/**
 * Configurable logger for UI Protocol packages.
 * Used by A2U parser, renderer, and event bus.
 *
 * @example Basic usage
 * ```typescript
 * import { createLogger, setLogLevel } from '@web-agent/ui-protocol';
 *
 * // Set global log level
 * setLogLevel('debug');
 *
 * // Create a scoped logger
 * const logger = createLogger('A2UParser');
 * logger.debug('Parsing response...');
 * logger.info('Parsed 5 components');
 * logger.warn('Unknown component type: custom-card');
 * logger.error('Failed to parse JSON', new Error('Invalid syntax'));
 * ```
 *
 * @module logger
 */

/** Log level type */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Log level priority (lower = more verbose) */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Current global log level */
let currentLogLevel: LogLevel =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
    ? 'debug'
    : 'warn';

/**
 * Set the global log level for all UI Protocol loggers.
 *
 * @param level - The minimum level of messages to log
 *
 * @example
 * ```typescript
 * setLogLevel('debug'); // Log everything
 * setLogLevel('warn');  // Only warnings and errors
 * setLogLevel('error'); // Only errors
 * ```
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current global log level.
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Logger interface for scoped logging.
 */
export interface Logger {
  /** Log debug-level message (most verbose) */
  debug(message: string, ...args: unknown[]): void;
  /** Log info-level message */
  info(message: string, ...args: unknown[]): void;
  /** Log warning-level message */
  warn(message: string, ...args: unknown[]): void;
  /** Log error-level message */
  error(message: string, error?: Error | unknown): void;
}

/**
 * Check if a log level should be output given the current global level.
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * Create a scoped logger instance.
 *
 * @param scope - The component/module name to prefix log messages with
 * @returns A Logger instance with debug, info, warn, and error methods
 *
 * @example
 * ```typescript
 * const logger = createLogger('A2URenderer');
 *
 * logger.debug('Starting render cycle');
 * // Output: [A2URenderer] Starting render cycle
 *
 * logger.error('Render failed', new Error('Invalid component'));
 * // Output: [A2URenderer] Render failed
 * //         Error: Invalid component
 * ```
 */
export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;

  return {
    debug(message: string, ...args: unknown[]): void {
      if (shouldLog('debug')) {
        console.debug(prefix, message, ...args);
      }
    },

    info(message: string, ...args: unknown[]): void {
      if (shouldLog('info')) {
        console.info(prefix, message, ...args);
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (shouldLog('warn')) {
        console.warn(prefix, message, ...args);
      }
    },

    error(message: string, error?: Error | unknown): void {
      if (shouldLog('error')) {
        if (error instanceof Error) {
          console.error(prefix, message, error);
        } else if (error !== undefined) {
          console.error(prefix, message, error);
        } else {
          console.error(prefix, message);
        }
      }
    },
  };
}

/** Default logger instance for UI Protocol */
export const logger = createLogger('UIProtocol');

