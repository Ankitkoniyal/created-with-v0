// Error tracking utility
// Supports Sentry or console fallback
// To enable Sentry, install @sentry/nextjs and set SENTRY_DSN env variable

interface ErrorContext {
  userId?: string
  [key: string]: unknown
}

class ErrorTracker {
  private initialized = false

  async init() {
    // Check if Sentry is available
    if (process.env.SENTRY_DSN && typeof window !== "undefined") {
      try {
        // Dynamic import to avoid bundling Sentry if not used
        const Sentry = await import("@sentry/nextjs")
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || "development",
          tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        })
        this.initialized = true
      } catch (error) {
        console.warn("Failed to initialize Sentry:", error)
      }
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    if (this.initialized && typeof window !== "undefined") {
      try {
        // @ts-ignore - Sentry may not be installed
        if (window.Sentry) {
          // @ts-ignore
          window.Sentry.captureException(error, { extra: context })
          return
        }
      } catch {
        // Fall through to console
      }
    }

    // Fallback to console
    console.error("Error:", error, context)
  }

  captureMessage(message: string, level: "info" | "warning" | "error" = "error", context?: ErrorContext) {
    if (this.initialized && typeof window !== "undefined") {
      try {
        // @ts-ignore - Sentry may not be installed
        if (window.Sentry) {
          // @ts-ignore
          window.Sentry.captureMessage(message, { level, extra: context })
          return
        }
      } catch {
        // Fall through to console
      }
    }

    // Fallback to console
    if (level === "error") {
      console.error("Error:", message, context)
    } else if (level === "warning") {
      console.warn("Warning:", message, context)
    } else {
      console.info("Info:", message, context)
    }
  }

  setUser(userId: string, email?: string) {
    if (this.initialized && typeof window !== "undefined") {
      try {
        // @ts-ignore - Sentry may not be installed
        if (window.Sentry) {
          // @ts-ignore
          window.Sentry.setUser({ id: userId, email })
          return
        }
      } catch {
        // Ignore
      }
    }
  }
}

export const errorTracker = new ErrorTracker()

// Initialize on import (client-side only)
if (typeof window !== "undefined") {
  errorTracker.init().catch(() => {
    // Ignore initialization errors
  })
}

