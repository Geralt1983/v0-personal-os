type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  component?: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private minLevel: LogLevel
  private component?: string

  constructor(minLevel: LogLevel = "info", component?: string) {
    this.minLevel = process.env.NODE_ENV === "development" ? "debug" : minLevel
    this.component = component
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component: this.component,
    }
  }

  private output(entry: LogEntry): void {
    const prefix = `[LifeOS]${entry.component ? `[${entry.component}]` : ""}`
    const formatted = `${prefix} ${entry.message}`

    switch (entry.level) {
      case "debug":
        console.debug(formatted, entry.context || "")
        break
      case "info":
        console.info(formatted, entry.context || "")
        break
      case "warn":
        console.warn(formatted, entry.context || "")
        break
      case "error":
        console.error(formatted, entry.context || "")
        break
    }

    // In production, you could send to external service
    if (process.env.NODE_ENV === "production" && entry.level === "error") {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(_entry: LogEntry): void {
    // Placeholder for external logging service (e.g., Sentry, LogRocket)
    // TODO: Implement when service is configured
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      this.output(this.formatEntry("debug", message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      this.output(this.formatEntry("info", message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      this.output(this.formatEntry("warn", message, context))
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog("error")) {
      this.output(this.formatEntry("error", message, context))
    }
  }

  child(component: string): Logger {
    return new Logger(this.minLevel, component)
  }
}

// Global logger instance
export const logger = new Logger()

// Component-specific loggers
export const createLogger = (component: string): Logger => {
  return logger.child(component)
}

// Performance timing helper
export function logTiming(label: string, fn: () => void): void {
  const start = performance.now()
  fn()
  const duration = performance.now() - start
  logger.debug(`${label} completed`, { durationMs: duration.toFixed(2) })
}

// Async timing helper
export async function logAsyncTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    logger.debug(`${label} completed`, { durationMs: duration.toFixed(2) })
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`${label} failed`, {
      durationMs: duration.toFixed(2),
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
