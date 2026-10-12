type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  timestamp: string;
  message: string;
  [key: string]: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const payload: LogPayload = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    };
    return JSON.stringify(payload);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatLog('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.formatLog('error', message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('debug', message, meta));
    }
  }
}

export const logger = new Logger();
