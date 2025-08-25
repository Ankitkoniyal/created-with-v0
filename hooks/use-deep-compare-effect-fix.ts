"use client"
\
The Problem
\
In your useEffect dependency array, you're using JSON.stringify(filters):

javascript
useEffect(() =>
{
  // fetch logic
  \
}
, [searchQuery, JSON.stringify(filters)]) // ❌ This causes infinite re-renders
\
The issue is that JSON.stringify(filters) creates a new string on every render, even
if the filter
values
haven
\'t actually changed. This causes the useEffect to run repeatedly, creating an infinite loop.

The Solution
\
Instead of
using JSON
.stringify(), you should either:

Use individual filter properties as dependencies

Use a deep comparison hook (recommended)

Option 1: Use Individual Dependencies (Simple fix)
javascript
useEffect(() =>
{
  const fetchProducts = async () => {
    // your fetch logic
  }
  fetchProducts()
  \
}
, [
  searchQuery, 
  filters.category,
  filters.subcategory,
  filters.minPrice,
  filters.maxPrice,
  filters.condition,
  filters.location,
  filters.sortBy
])
\
Option 2: Create a useDeepCompareEffect Hook (Better solution)
\
Create a custom hook
for deep comparison
:

javascript
// Create this hook in a separate file or at the top of your component
import { useRef, useEffect } from "react"
import isEqual from "lodash/isEqual" // or implement your own deep comparison

function useDeepCompareEffect(callback, dependencies) {
  const currentDependenciesRef = useRef()

  if (!isEqual(currentDependenciesRef.current, dependencies)) {
    currentDependenciesRef.current = dependencies
  }

  useEffect(callback, [currentDependenciesRef.current])
}
\
Then use it in your component:

javascript
useDeepCompareEffect(() =>
{
  const fetchProducts = async () => {
    console.log("[v0] Fetching products from database...")
    setLoading(true)
    setError(null)

    try {
      // your existing fetch logic
    } catch (err) {
      console.error("[v0] Search error:", err)
      setError("An error occurred while searching. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  fetchProducts()
  \
}
, [searchQuery, filters]) // ✅ Now uses proper deep comparison
