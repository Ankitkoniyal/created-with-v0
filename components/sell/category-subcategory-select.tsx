import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
}

interface CategorySubcategorySelectProps {
  categories: Category[]
  subcategories: Subcategory[]
  selectedCategory: string
  selectedSubcategory: string
  onCategoryChange: (value: string) => void
  onSubcategoryChange: (value: string) => void
}

export function CategorySubcategorySelect({ 
  categories, 
  subcategories, 
  selectedCategory, 
  selectedSubcategory, 
  onCategoryChange, 
  onSubcategoryChange 
}: CategorySubcategorySelectProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select onValueChange={onCategoryChange} value={selectedCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subcategory">Subcategory</Label>
        <Select onValueChange={onSubcategoryChange} value={selectedSubcategory} disabled={!selectedCategory || subcategories.length === 0}>
          <SelectTrigger id="subcategory">
            <SelectValue placeholder="Select a subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map(subcategory => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}