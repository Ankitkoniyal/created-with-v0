"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Camera, MapPin, Package, FileText, ImageIcon, Tag, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductFormData {
  title: string
  description: string
  price: string
  priceType: "amount" | "free" | "contact" | "swap"
  category: string
  subcategory: string
  condition: string
  brand: string
  model: string
  address: string
  location: string
  postalCode: string
  youtubeUrl: string
  websiteUrl: string
  showMobileNumber: boolean
  tags: string[]
  images: File[]
  features: string[]
}

interface Category {
  name: string
  subcategories: string[]
}

const categories: Category[] = [
  {
    name: "Vehicles",
    subcategories: [
      "Cars",
      "Motorcycles",
      "Trucks",
      "Buses",
      "Bicycles",
      "Scooters",
      "Boats",
      "RVs",
      "ATVs",
      "Parts & Accessories",
    ],
  },
  {
    name: "Electronics",
    subcategories: [
      "TV",
      "Fridge",
      "Oven",
      "AC",
      "Cooler",
      "Toaster",
      "Fan",
      "Washing Machine",
      "Microwave",
      "Computer",
      "Laptop",
      "Camera",
      "Audio System",
    ],
  },
  {
    name: "Mobile",
    subcategories: [
      "Smartphones",
      "Tablets",
      "Accessories",
      "Cases & Covers",
      "Chargers",
      "Headphones",
      "Smart Watches",
      "Power Banks",
    ],
  },
  {
    name: "Real Estate",
    subcategories: [
      "Houses",
      "Apartments",
      "Commercial",
      "Land",
      "Rental",
      "Vacation Rentals",
      "Office Space",
      "Warehouse",
    ],
  },
  {
    name: "Fashion",
    subcategories: [
      "Men's Clothing",
      "Women's Clothing",
      "Kids Clothing",
      "Shoes",
      "Bags",
      "Jewelry",
      "Watches",
      "Accessories",
    ],
  },
  {
    name: "Pets",
    subcategories: ["Dogs", "Cats", "Birds", "Fish", "Pet Food", "Pet Accessories", "Pet Care", "Pet Services"],
  },
  {
    name: "Furniture",
    subcategories: ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Cabinet", "Dining Set", "Home Decor"],
  },
  {
    name: "Jobs",
    subcategories: ["Full Time", "Part Time", "Freelance", "Internship", "Remote Work", "Contract", "Temporary"],
  },
  {
    name: "Gaming",
    subcategories: ["Video Games", "Consoles", "PC Gaming", "Mobile Games", "Gaming Accessories", "Board Games"],
  },
  {
    name: "Books",
    subcategories: ["Fiction", "Non-Fiction", "Educational", "Comics", "Magazines", "E-books", "Audiobooks"],
  },
  {
    name: "Services",
    subcategories: [
      "Home Services",
      "Repair",
      "Cleaning",
      "Tutoring",
      "Photography",
      "Event Planning",
      "Transportation",
    ],
  },
  {
    name: "Other",
    subcategories: [
      "Sports Equipment",
      "Musical Instruments",
      "Art & Crafts",
      "Collectibles",
      "Tools",
      "Garden",
      "Baby Items",
    ],
  },
]

const CANADIAN_LOCATIONS = [
  { province: "Alberta", cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge"] },
  { province: "British Columbia", cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"] },
  { province: "Manitoba", cities: ["Winnipeg", "Brandon", "Steinbach"] },
  { province: "New Brunswick", cities: ["Saint John", "Moncton", "Fredericton"] },
  { province: "Newfoundland and Labrador", cities: ["St. John's", "Corner Brook", "Mount Pearl"] },
  { province: "Northwest Territories", cities: ["Yellowknife", "Hay River"] },
  { province: "Nova Scotia", cities: ["Halifax", "Sydney", "Dartmouth"] },
  { province: "Nunavut", cities: ["Iqaluit", "Rankin Inlet"] },
  { province: "Ontario", cities: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham"] },
  { province: "Prince Edward Island", cities: ["Charlottetown", "Summerside"] },
  { province: "Quebec", cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"] },
  { province: "Saskatchewan", cities: ["Saskatoon", "Regina", "Prince Albert"] },
  { province: "Yukon", cities: ["Whitehorse", "Dawson City"] },
]

const conditions = ["New", "Like New", "Good", "Fair", "Poor"]

const mapConditionToDatabase = (condition: string): string => {
  const conditionMap: { [key: string]: string } = {
    New: "new",
    "Like New": "like_new",
    Good: "good",
    Fair: "fair",
    Poor: "poor",
  }
  return conditionMap[condition] || condition.toLowerCase()
}

const parseLocation = (location: string): { city: string; province: string } => {
  const parts = location.split(", ")
  const city = parts.length >= 2 ? parts[parts.length - 1] : ""
  const province = parts.length >= 2 ? parts[parts.length - 2] : ""
  return { city, province }
}

export function PostProductForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    priceType: "amount",
    category: "",
    subcategory: "",
    condition: "",
    brand: "",
    model: "",
    address: "",
    location: "",
    postalCode: "",
    youtubeUrl: "",
    websiteUrl: "",
    showMobileNumber: true,
    tags: [],
    images: [],
    features: [],
  })
  const [newFeature, setNewFeature] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "category" && { subcategory: "" }),
      ...(field === "priceType" && value !== "amount" && { price: "" }),
      ...(field === "price" && value && { priceType: "amount" }),
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const validFiles = files.filter((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 2MB per image.`)
        return false
      }
      return true
    })

    if (formData.images.length + validFiles.length <= 5) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...validFiles] }))
    } else {
      toast.error("You can upload maximum 5 images.")
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Please log in to post an ad")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Starting ad submission process")

      const supabase = createClient()
      console.log("[v0] Supabase client created successfully")

      // Upload images first
      const imageUrls: string[] = []
      if (formData.images.length > 0) {
        console.log("[v0] Uploading images:", formData.images.length)

        for (const image of formData.images) {
          const fileExt = image.name.split(".").pop()
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          console.log("[v0] Uploading image:", fileName)

          const { data, error } = await supabase.storage.from("product-images").upload(fileName, image)

          if (error) {
            console.error("[v0] Image upload error:", error)
            throw new Error(`Failed to upload image: ${error.message}`)
          }

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName)
          imageUrls.push(urlData.publicUrl)
          console.log("[v0] Image uploaded successfully:", urlData.publicUrl)
        }
      }

      console.log("[v0] Image upload phase completed. URLs:", imageUrls.length, "Failed:", false)

      // Parse location to get city and province
      const locationParts = parseLocation(formData.location)
      const city = locationParts.city || formData.location.split(",")[0]?.trim() || ""
      const province = locationParts.province || formData.location.split(",")[1]?.trim() || ""

      console.log("[v0] Preparing product data...")

      // Get category information
      const selectedCategory = categories.find((cat) => cat.name === formData.category)
      const selectedSubcategory = selectedCategory?.subcategories.find((sub) => sub === formData.subcategory)
      const primaryCategory = selectedSubcategory || selectedCategory?.name || formData.category
      const categoryIndex = categories.findIndex((cat) => cat.name === formData.category) + 1

      console.log("[v0] Primary category:", primaryCategory)
      console.log("[v0] Category index:", categoryIndex)
      console.log("[v0] Form category:", formData.category)
      console.log("[v0] Form subcategory:", formData.subcategory)
      console.log("[v0] Location parts:", { city, province })

      const productData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(), // Keep only user's actual description
        price: formData.priceType === "amount" ? Number.parseFloat(formData.price) || 0 : 0,
        condition: mapConditionToDatabase(formData.condition),
        location: `${formData.address}, ${city}`.trim(),
        city: city,
        province: province,
        image_urls: imageUrls, // Changed from 'images' to 'image_urls'
        category_id: categoryIndex,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        youtube_url: formData.youtubeUrl.trim() || null,
        website_url: formData.websiteUrl.trim() || null,
        address: formData.address.trim() || null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Product data prepared:", JSON.stringify(productData, null, 2))
      console.log("[v0] Attempting to insert product data...")

      const { data, error } = await supabase.from("products").insert(productData).select().single()

      if (error) {
        console.error("[v0] Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        if (error.message.includes("row-level security") || error.message.includes("policy")) {
          setSubmitError(
            "Database security policies need to be configured. Please contact your administrator to enable ad posting.",
          )
          return
        } else if (error.message.includes("column") && error.message.includes("does not exist")) {
          console.error("[v0] Missing database column:", error.message)
          setSubmitError(`Database schema issue: ${error.message}. Please run the required database migrations.`)
          return
        } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
          setSubmitError("A similar ad already exists. Please modify your listing and try again.")
          return
        } else {
          setSubmitError(`Failed to post your ad: ${error.message}. Please try again.`)
          return
        }
      }

      console.log("[v0] Product saved successfully:", data)

      const successMessage = "Your ad has been posted successfully!"

      console.log("[v0] Redirecting to success page with ID:", data.id)
      sessionStorage.setItem("adPostSuccess", successMessage)
      router.push(`/sell/success?id=${data.id}`)
    } catch (error) {
      console.error("[v0] Submission error details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      setSubmitError(
        `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      )
    } finally {
      setIsSubmitting(false)
      console.log("[v0] Ad submission process completed")
    }
  }

  const isStep1Valid = formData.images.length > 0
  const isStep2Valid =
    formData.title && formData.category && formData.condition && (formData.priceType !== "amount" || formData.price)
  const isStep3Valid = formData.description && formData.address && formData.location && formData.postalCode

  return (
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 4 && <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Upload Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Add up to 5 photos (max 2MB each). The first photo will be your main image.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image) || "/placeholder.svg"}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && <Badge className="absolute bottom-2 left-2 text-xs">Main</Badge>}
                  </div>
                ))}

                {formData.images.length < 5 && (
                  <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                    <span className="text-xs text-muted-foreground">Max 2MB</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                placeholder="e.g., iPhone 14 Pro Max - Excellent Condition"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                maxLength={100}
                className="border-2 border-gray-200 focus:border-primary"
              />
              <p className="text-sm text-muted-foreground">{formData.title.length}/100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail. Include any defects, usage history, and why you're selling."
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                maxLength={1000}
                className="border-2 border-gray-200 focus:border-primary"
              />
              <p className="text-sm text-muted-foreground">{formData.description.length}/1000 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => handleInputChange("subcategory", value)}
                  disabled={
                    !formData.category ||
                    !categories.find((cat) => cat.name === formData.category)?.subcategories.length
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category &&
                      categories
                        .find((cat) => cat.name === formData.category)
                        ?.subcategories.map((subcategory) => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Apple, Samsung, Honda"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  className="border-2 border-gray-200 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., iPhone 14 Pro Max, Galaxy S23"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="border-2 border-gray-200 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceType">Price Type *</Label>
                <Select value={formData.priceType} onValueChange={(value) => handleInputChange("priceType", value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select price type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Set Price</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="contact">Contact for Price</SelectItem>
                    <SelectItem value="swap">Swap/Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.priceType === "amount" && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (CAD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="border-2 border-gray-200 focus:border-primary"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="space-y-2">{/* Empty div for consistent spacing */}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Additional Details & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <Label className="text-base font-semibold">Additional Links (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube Video Link</Label>
                  <Input
                    id="youtubeUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                    className="border-2 border-gray-200 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">Add a YouTube video showcasing your product</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website Link</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    className="border-2 border-gray-200 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">Link to your website or product page</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg">
              <Checkbox
                id="showMobileNumber"
                checked={formData.showMobileNumber}
                onCheckedChange={(checked) => handleInputChange("showMobileNumber", checked as boolean)}
                className="w-5 h-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1">
                <Label htmlFor="showMobileNumber" className="text-sm font-medium cursor-pointer">
                  Show my mobile number on this ad
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Your number will be partially hidden. Only logged-in users can view the full number.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <Label className="flex items-center text-base font-semibold">
                <Tag className="h-5 w-5 mr-2" />
                Tags (Max 5 words)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add relevant keywords to improve your ad's search visibility and help buyers find your item
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    maxLength={20}
                    disabled={formData.tags.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!newTag.trim() || formData.tags.length >= 5 || formData.tags.includes(newTag.trim())}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{formData.tags.length}/5 tags used</p>
              </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <Label className="text-base font-semibold">Key Features (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addFeature()}
                  className="border-2 border-gray-200 focus:border-primary"
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  Add
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFeature(feature)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <Label className="flex items-center text-base font-semibold">
                <MapPin className="h-5 w-5 mr-2" />
                Location Details *
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main Street"
                    className="border-2 border-gray-200 focus:border-primary"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">City/Province *</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                        <SelectValue placeholder="Select city/province" />
                      </SelectTrigger>
                      <SelectContent>
                        {CANADIAN_LOCATIONS.map((location) => (
                          <div key={location.province}>
                            <SelectItem value={location.province} className="font-semibold">
                              {location.province}
                            </SelectItem>
                            {location.cities.map((city) => (
                              <SelectItem key={city} value={`${city}, ${location.province}`} className="pl-6">
                                {city}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      placeholder="e.g., M5V 3A8"
                      className="border-2 border-gray-200 focus:border-primary"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value.toUpperCase())}
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Product Details</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Title:</span> {formData.title}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Category:</span> {formData.category}
                    </p>
                    {formData.subcategory && (
                      <p>
                        <span className="text-muted-foreground">Subcategory:</span> {formData.subcategory}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">Condition:</span> {formData.condition}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      {formData.priceType === "amount" && `$${formData.price}`}
                      {formData.priceType === "free" && "Free"}
                      {formData.priceType === "contact" && "Contact Us"}
                      {formData.priceType === "swap" && "Swap/Exchange"}
                    </p>
                    {formData.brand && (
                      <p>
                        <span className="text-muted-foreground">Brand:</span> {formData.brand}
                      </p>
                    )}
                    {formData.model && (
                      <p>
                        <span className="text-muted-foreground">Model:</span> {formData.model}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">Location:</span>{" "}
                      {formData.address && `${formData.address}, `}
                      {formData.location}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Postal Code:</span> {formData.postalCode}
                    </p>
                    {formData.youtubeUrl && (
                      <p>
                        <span className="text-muted-foreground">YouTube:</span> {formData.youtubeUrl}
                      </p>
                    )}
                    {formData.websiteUrl && (
                      <p>
                        <span className="text-muted-foreground">Website:</span> {formData.websiteUrl}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">Show Mobile:</span>{" "}
                      {formData.showMobileNumber ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {formData.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <div className="flex flex-wrap gap-1">
                      {formData.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Photos ({formData.images.length})</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1 || isSubmitting}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={
              (currentStep === 1 && !isStep1Valid) ||
              (currentStep === 2 && !isStep2Valid) ||
              (currentStep === 3 && !isStep3Valid) ||
              isSubmitting
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? "Publishing..." : "Publish Listing"}
          </Button>
        )}
      </div>
    </div>
  )
}
