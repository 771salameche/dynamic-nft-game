/**
 * Logger utility for the backend service.
 * Provides structured, timestamped logging with log levels.
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

const LOG_COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
    [LogLevel.INFO]: '\x1b[32m',   // Green
    [LogLevel.WARN]: '\x1b[33m',   // Yellow
    [LogLevel.ERROR]: '\x1b[31m',  // Red
};

const RESET = '\x1b[0m';

function formatTimestamp(): string {
    return new Date().toISOString();
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
    const color = LOG_COLORS[level];
    const timestamp = formatTimestamp();
    const prefix = `${color}[${level}]${RESET} ${timestamp} [${context}]`;

    if (data) {
        console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

export const logger = {
    debug: (context: string, message: string, data?: unknown) => log(LogLevel.DEBUG, context, message, data),
    info: (context: string, message: string, data?: unknown) => log(LogLevel.INFO, context, message, data),
    warn: (context: string, message: string, data?: unknown) => log(LogLevel.WARN, context, message, data),
    error: (context: string, message: string, data?: unknown) => log(LogLevel.ERROR, context, message, data),
};

export default logger;
