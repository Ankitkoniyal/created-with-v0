"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { majorCities, indianStates } from "@/lib/mock-data"

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({ value, onChange, placeholder = "Enter location...", className }: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const allLocations = [...majorCities, ...indianStates]

  useEffect(() => {
    if (value.length > 0) {
      const filtered = allLocations
        .filter((location) => location.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8)
      setSuggestions(filtered)
      setIsOpen(filtered.length > 0)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() =>
            value.length > 0 &&
            setSuggestions(
              allLocations.filter((location) => location.toLowerCase().includes(value.toLowerCase())).slice(0, 8),
            )
          }
          className={`pl-10 ${className}`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                {suggestion}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
