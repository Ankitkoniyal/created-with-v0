// Production-safe logging utility
// Only logs errors in production, all logs in development

type LogLevel = "info" | "warn" | "error" | "debug"

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    // In production, only log errors
    return level === "error"
  }

  log(level: LogLevel, message: string, metadata?: Record<string, any>, userId?: string) {
    if (!this.shouldLog(level)) return

    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
      ...(userId && { userId }),
    }

    switch (level) {
      case "error":
        console.error(`[${level.toUpperCase()}]`, message, metadata || "")
        break
      case "warn":
        console.warn(`[${level.toUpperCase()}]`, message, metadata || "")
        break
      case "debug":
        console.debug(`[${level.toUpperCase()}]`, message, metadata || "")
        break
      default:
        console.log(`[${level.toUpperCase()}]`, message, metadata || "")
    }
  }

  info(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("info", message, metadata, userId)
  }

  warn(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("warn", message, metadata, userId)
  }

  error(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("error", message, metadata, userId)
  }

  debug(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("debug", message, metadata, userId)
  }
}

export const logger = new Logger()
