"use client"

import { useEffect } from "react"
import { onCLS, onFID, onLCP, onINP, onTTFB, type Metric } from "web-vitals"

function send(metric: Metric) {
  try {
    // Avoid blocking the main thread; allow browser to batch
    navigator.sendBeacon?.("/api/metrics/vitals", new Blob([JSON.stringify(metric)], { type: "application/json" })) ||
      fetch("/api/metrics/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        keepalive: true,
        body: JSON.stringify(metric),
      })
  } catch {
    // no-op
  }
}

export function WebVitalsClient() {
  useEffect(() => {
    onCLS(send)
    onFID(send)
    onLCP(send)
    onINP?.(send)
    onTTFB(send)
  }, [])
  return null
}
