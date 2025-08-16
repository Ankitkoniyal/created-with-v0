"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Camera, MapPin, DollarSign, Package, FileText, ImageIcon, Youtube, Globe, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

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
  location: string
  postalCode: string
  youtubeUrl: string
  websiteUrl: string
  showMobileNumber: boolean
  tags: string[]
  images: File[]
  features: string[]
}

const categories = [
  "Vehicles",
  "Electronics",
  "Mobile",
  "Real Estate",
  "Fashion",
  "Pets",
  "Furniture",
  "Jobs",
  "Gaming",
  "Books",
  "Services",
  "Other",
]

const subcategories: Record<string, string[]> = {
  Electronics: [
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
  Vehicles: [
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
  Mobile: [
    "Smartphones",
    "Tablets",
    "Accessories",
    "Cases & Covers",
    "Chargers",
    "Headphones",
    "Smart Watches",
    "Power Banks",
  ],
  "Real Estate": [
    "Houses",
    "Apartments",
    "Commercial",
    "Land",
    "Rental",
    "Vacation Rentals",
    "Office Space",
    "Warehouse",
  ],
  Fashion: [
    "Men's Clothing",
    "Women's Clothing",
    "Kids Clothing",
    "Shoes",
    "Bags",
    "Jewelry",
    "Watches",
    "Accessories",
  ],
  Pets: ["Dogs", "Cats", "Birds", "Fish", "Pet Food", "Pet Accessories", "Pet Care", "Pet Services"],
  Furniture: ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Cabinet", "Dining Set", "Home Decor"],
  Jobs: ["Full Time", "Part Time", "Freelance", "Internship", "Remote Work", "Contract", "Temporary"],
  Gaming: ["Video Games", "Consoles", "PC Gaming", "Mobile Games", "Gaming Accessories", "Board Games"],
  Books: ["Fiction", "Non-Fiction", "Educational", "Comics", "Magazines", "E-books", "Audiobooks"],
  Services: ["Home Services", "Repair", "Cleaning", "Tutoring", "Photography", "Event Planning", "Transportation"],
  Other: ["Sports Equipment", "Musical Instruments", "Art & Crafts", "Collectibles", "Tools", "Garden", "Baby Items"],
}

const conditions = ["New", "Used-Like New", "Fair", "Old"]

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
    location: "",
    postalCode: "",
    youtubeUrl: "",
    websiteUrl: "",
    showMobileNumber: false,
    tags: [],
    images: [],
    features: [],
  })
  const [newFeature, setNewFeature] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        alert(`${file.name} is too large. Maximum size is 2MB per image.`)
        return false
      }
      return true
    })

    if (formData.images.length + validFiles.length <= 5) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...validFiles] }))
    } else {
      alert("You can upload maximum 5 images.")
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

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to post an ad")
      router.push("/auth/login")
      return
    }

    if (!formData.postalCode.trim()) {
      alert("Postal code is required")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const imageUrls: string[] = []
      if (formData.images.length > 0) {
        for (const image of formData.images) {
          try {
            const fileName = `${user.id}/${Date.now()}-${image.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(fileName, image)

            if (uploadError) {
              console.error("Image upload error:", uploadError)
              if (uploadError.message.includes("row-level security") || uploadError.message.includes("policy")) {
                console.log("[v0] Skipping image upload due to RLS policy")
                break
              } else {
                alert(`Failed to upload image ${image.name}. Please check your connection and try again.`)
                return
              }
            } else {
              const {
                data: { publicUrl },
              } = supabase.storage.from("product-images").getPublicUrl(fileName)
              imageUrls.push(publicUrl)
            }
          } catch (uploadError) {
            console.error("Image upload failed:", uploadError)
            continue
          }
        }
      }

      const productData = {
        title: formData.title,
        description: `${formData.description}${formData.location ? `\n\nLocation: ${formData.location}` : ""}${formData.postalCode ? ` ${formData.postalCode}` : ""}${formData.youtubeUrl ? `\n\nVideo: ${formData.youtubeUrl}` : ""}${formData.websiteUrl ? `\n\nWebsite: ${formData.websiteUrl}` : ""}${formData.tags.length > 0 ? `\n\nTags: ${formData.tags.join(", ")}` : ""}${formData.showMobileNumber ? "\n\n📱 Mobile number available - contact seller" : ""}`,
        price: formData.priceType === "amount" ? Number.parseFloat(formData.price) || 0 : 0,
        category_id: Math.max(1, categories.indexOf(formData.category) + 1), // Map category name to ID
        condition: formData.condition,
        brand: formData.brand || null,
        model: formData.model || null,
        images: imageUrls,
        user_id: user.id,
      }

      console.log("[v0] Attempting to insert product data:", productData)

      const { data, error } = await supabase.from("products").insert(productData).select().single()

      if (error) {
        console.error("Database error:", error)
        if (error.message.includes("row-level security") || error.message.includes("policy")) {
          alert("Permission denied. Please make sure you're logged in and try again.")
        } else if (error.message.includes("column") && error.message.includes("does not exist")) {
          alert("Some advanced features are not available. Your listing will be posted with basic information.")
          const minimalData = {
            title: formData.title,
            description: formData.description,
            price: formData.priceType === "amount" ? Number.parseFloat(formData.price) || 0 : 0,
            user_id: user.id,
          }

          const { data: minimalResult, error: minimalError } = await supabase
            .from("products")
            .insert(minimalData)
            .select()
            .single()

          if (minimalError) {
            console.error("Minimal insert also failed:", minimalError)
            alert("Failed to post your ad. Please try again later.")
            return
          }

          console.log("[v0] Product saved with minimal info:", minimalResult)
          alert("Your ad has been posted successfully!")
          router.push(`/dashboard/listings`)
          return
        } else {
          alert("Failed to post your ad. Please try again.")
        }
        return
      }

      console.log("[v0] Product saved successfully:", data)
      alert("Your ad has been posted successfully!")
      router.push(`/dashboard/listings`)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to post your ad. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStep1Valid = formData.images.length > 0
  const isStep2Valid =
    formData.title && formData.category && formData.condition && (formData.priceType !== "amount" || formData.price)
  const isStep3Valid = formData.description && formData.location && formData.postalCode

  return (
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                  disabled={!formData.category || !subcategories[formData.category]}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category &&
                      subcategories[formData.category]?.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-2">{/* Empty div for consistent spacing */}</div>
            </div>

            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <Label className="flex items-center text-base font-semibold">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing *
              </Label>

              {/* Price type selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "amount", label: "Set Price" },
                  { value: "free", label: "Free" },
                  { value: "contact", label: "Contact Us" },
                  { value: "swap", label: "Swap/Exchange" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("priceType", option.value)}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                      formData.priceType === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={formData.price && option.value !== "amount"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Price input - only show when "Set Price" is selected */}
              {formData.priceType === "amount" && (
                <div className="space-y-2">
                  <Label htmlFor="price">Enter Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      className="pl-10 border-2 border-gray-200 focus:border-primary"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Show selected option message */}
              {formData.priceType !== "amount" && (
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  Selected:{" "}
                  <span className="font-medium">
                    {formData.priceType === "free" && "This item is free"}
                    {formData.priceType === "contact" && "Buyers will contact you for pricing"}
                    {formData.priceType === "swap" && "You're looking to swap/exchange this item"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Description & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Toronto, ON"
                    className="pl-10 border-2 border-gray-200 focus:border-primary"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube Video (Optional)</Label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="youtubeUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    className="pl-10 border-2 border-gray-200 focus:border-primary"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="websiteUrl"
                    placeholder="https://example.com"
                    className="pl-10 border-2 border-gray-200 focus:border-primary"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg">
              <Checkbox
                id="showMobileNumber"
                checked={formData.showMobileNumber}
                onCheckedChange={(checked) => handleInputChange("showMobileNumber", checked as boolean)}
              />
              <Label htmlFor="showMobileNumber" className="text-sm font-medium">
                Show my mobile number on this ad
              </Label>
            </div>

            <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg">
              <div>
                <Label className="flex items-center text-base font-semibold">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags (Max 5 words)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add relevant keywords to improve your ad's search visibility and help buyers find your item
                </p>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  className="border-2 border-gray-200 focus:border-primary"
                  disabled={formData.tags.length >= 5}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  disabled={formData.tags.length >= 5 || !newTag.trim()}
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{formData.tags.length}/5 tags used</p>
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
                      <span className="text-muted-foreground">Location:</span> {formData.location}
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
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={
              (currentStep === 1 && !isStep1Valid) ||
              (currentStep === 2 && !isStep2Valid) ||
              (currentStep === 3 && !isStep3Valid)
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
