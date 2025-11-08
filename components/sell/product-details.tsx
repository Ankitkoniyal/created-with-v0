import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductDetailsProps {
  condition: string
  brand: string
  priceType: string
  model: string
  price: number | ""
  onConditionChange: (value: string) => void
  onBrandChange: (value: string) => void
  onPriceTypeChange: (value: string) => void
  onModelChange: (value: string) => void
  onPriceChange: (value: number | "") => void
}

export function ProductDetails({ 
  condition, 
  brand, 
  priceType, 
  model, 
  price, 
  onConditionChange, 
  onBrandChange, 
  onPriceTypeChange, 
  onModelChange, 
  onPriceChange 
}: ProductDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <select
          id="condition"
          value={condition}
          onChange={(e) => onConditionChange(e.target.value)}
          className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
          required
        >
          <option value="">Select condition</option>
          <option value="new">New</option>
          <option value="used-like-new">Used - Like New</option>
          <option value="used-good">Used - Good</option>
          <option value="used-fair">Used - Fair</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Input id="brand" value={brand} onChange={(e) => onBrandChange(e.target.value)} placeholder="e.g. Apple" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="priceType">Price Type</Label>
        <select
          id="priceType"
          value={priceType}
          onChange={(e) => onPriceTypeChange(e.target.value)}
          className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
        >
          <option value="fixed">Fixed Price</option>
          <option value="negotiable">Negotiable</option>
          <option value="free">Free</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input id="model" value={model} onChange={(e) => onModelChange(e.target.value)} placeholder="e.g. iPhone 13 Pro" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input id="price" type="number" value={price} onChange={(e) => onPriceChange(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 999.99" required />
      </div>
    </div>
  )
}