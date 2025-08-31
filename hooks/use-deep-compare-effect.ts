"use client"

import { useRef, useEffect } from "react"

function isEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
    return true
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!isEqual(a[key], b[key])) return false
    }

    return true
  }

  return false
}

export function useDeepCompareEffect(callback: () => void | (() => void), dependencies: any[]) {
  const currentDependenciesRef = useRef<any[]>()

  const hasChanged = !isEqual(currentDependenciesRef.current, dependencies)

  if (hasChanged) {
    currentDependenciesRef.current = [...dependencies] // Create a copy to prevent mutation issues
  }

  useEffect(callback, hasChanged ? [currentDependenciesRef.current] : [currentDependenciesRef.current])
}
