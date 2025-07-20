"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { majorCities, indianStates, statesCitiesMap } from "@/lib/mock-data"

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({
  value,
  onChange,
  placeholder = "Select location...",
  className,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Combine major cities and states for search
  const allLocations = [
    ...majorCities.map((city) => ({ type: "city", name: city, value: city })),
    ...indianStates.map((state) => ({ type: "state", name: state, value: state })),
    // Add cities from states
    ...Object.entries(statesCitiesMap).flatMap(([state, cities]) =>
      cities.map((city) => ({ type: "city", name: `${city}, ${state}`, value: city })),
    ),
  ]

  // Remove duplicates and filter based on search
  const uniqueLocations = allLocations.filter(
    (location, index, self) => index === self.findIndex((l) => l.value === location.value),
  )

  const filteredLocations = uniqueLocations
    .filter((location) => location.name.toLowerCase().includes(searchValue.toLowerCase()))
    .slice(0, 10) // Limit to 10 results for performance

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-gray-400" />
            <span className="truncate">{value || placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search cities or states..." value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {filteredLocations.map((location) => (
                <CommandItem
                  key={`${location.type}-${location.value}`}
                  value={location.name}
                  onSelect={() => {
                    onChange(location.value)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === location.value ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-3 w-3 text-gray-400" />
                    <span>{location.name}</span>
                    {location.type === "state" && <span className="ml-2 text-xs text-gray-500">(State)</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
