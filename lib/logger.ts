type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  userId?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      environment: process.env.NODE_ENV,
      service: "olx-marketplace",
    })
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, userId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      userId,
      metadata,
    }

    if (this.isDevelopment) {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata || "")
    } else {
      console.log(this.formatLog(entry))
    }
  }

  info(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("info", message, metadata, userId)
  }

  warn(message: string, metadata?: Record<string, any>, userId?: string) {
    this.log("warn", message, metadata, userId)
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, userId?: string) {
    this.log(
      "error",
      message,
      {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
      userId,
    )
  }

  debug(message: string, metadata?: Record<string, any>, userId?: string) {
    if (this.isDevelopment) {
      this.log("debug", message, metadata, userId)
    }
  }
}

export const logger = new Logger()
