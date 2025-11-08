import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LocationDetailsProps {
  streetAddress: string
  city: string
  province: string
  postalCode: string
  onStreetAddressChange: (value: string) => void
  onCityChange: (value: string) => void
  onProvinceChange: (value: string) => void
  onPostalCodeChange: (value: string) => void
  canadianLocations: any
}

export function LocationDetails({ 
  streetAddress, 
  city, 
  province, 
  postalCode, 
  onStreetAddressChange, 
  onCityChange, 
  onProvinceChange, 
  onPostalCodeChange, 
  canadianLocations 
}: LocationDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input id="streetAddress" value={streetAddress} onChange={(e) => onStreetAddressChange(e.target.value)} placeholder="e.g. 123 Main St" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="e.g. Toronto" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <select
            id="province"
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
          >
            <option value="">Select province</option>
            {Object.keys(canadianLocations).map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input id="postalCode" value={postalCode} onChange={(e) => onPostalCodeChange(e.target.value)} placeholder="e.g. A1A 1A1" />
      </div>
    </div>
  )
}