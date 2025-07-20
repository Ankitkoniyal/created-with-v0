"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  mockCategories,
  indianStates,
  statesCitiesMap,
  brandsByCategory,
  generateAdId,
  saveAdToStorage,
  kmDrivenOptions,
  numberOfOwnersOptions,
  manufacturingYearOptions,
  transmissionOptions,
  fuelTypeOptions,
  type Ad,
} from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

export default function PostAdPage() {
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    condition: "",
    brand: "",
    model: "",
    year: "",
    negotiable: false,
    state: "",
    city: "",
    location: "",
    // Vehicle specific fields
    kmDriven: "",
    numberOfOwners: "",
    manufacturingYear: "", // Updated: Now stores actual manufacturing year
    transmissionType: "",
    fuelType: "",
    // Real estate specific fields
    propertyType: "",
    bhk: "",
  })

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth")
    }
  }, [user, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Reset city when state changes
    if (field === "state") {
      setFormData((prev) => ({ ...prev, city: "" }))
      setSelectedState(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (images.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newAd: Ad = {
      id: Date.now().toString(),
      adId: generateAdId(),
      title: formData.title,
      description: formData.description,
      price: formData.price ? Number.parseFloat(formData.price) : null,
      category_id: formData.category,
      subcategory_id: formData.subcategory || undefined,
      location: formData.location,
      city: formData.city,
      state: formData.state,
      condition: formData.condition as "new" | "second_hand" | "like_new",
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      year: formData.year ? Number.parseInt(formData.year) : undefined,
      negotiable: formData.negotiable,
      user_id: user.id,
      images: images,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Vehicle specific fields - Updated to use manufacturingYear
      kmDriven: formData.kmDriven || undefined,
      numberOfOwners: formData.numberOfOwners || undefined,
      manufacturingYear: formData.manufacturingYear ? Number.parseInt(formData.manufacturingYear) : undefined,
      transmissionType: formData.transmissionType || undefined,
      fuelType: formData.fuelType || undefined,
      // Real estate specific fields
      propertyType: formData.propertyType || undefined,
      bhk: formData.bhk || undefined,
    }

    // Save to localStorage
    saveAdToStorage(newAd)

    toast({
      title: "Success",
      description: `Your ad has been posted successfully! Ad ID: ${newAd.adId}`,
    })

    router.push("/my-ads")
    setLoading(false)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const selectedCategoryBrands =
    selectedCategory && selectedCategory !== "" ? brandsByCategory[selectedCategory] || [] : []

  const selectedCategoryData = mockCategories.find((cat) => cat.id === selectedCategory)
  const isVehicleCategory = selectedCategory === "2" || selectedCategory === "10" // Car or Bike
  const isRealEstateCategory = selectedCategory === "11"
  const isElectronicsCategory = selectedCategory === "1"

  // Get cities for selected state
  const availableCities = selectedState ? statesCitiesMap[selectedState] || [] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Post Your Ad</CardTitle>
            <p className="text-gray-600">Fill in the details below to post your ad</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                    placeholder="e.g., iPhone 14 Pro Max - Excellent Condition"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                    placeholder="Describe your item in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        handleInputChange("category", value)
                        setSelectedCategory(value)
                        // Reset subcategory when category changes
                        handleInputChange("subcategory", "")
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory for categories with subcategories */}
                  {selectedCategoryData?.subcategories && (
                    <div>
                      <Label htmlFor="subcategory">
                        {isElectronicsCategory
                          ? "Electronics Type"
                          : isRealEstateCategory
                            ? "Property Type"
                            : selectedCategory === "2"
                              ? "Car Type"
                              : selectedCategory === "10"
                                ? "Bike Type"
                                : "Subcategory"}{" "}
                        *
                      </Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => handleInputChange("subcategory", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`Select ${
                              isElectronicsCategory
                                ? "electronics type"
                                : isRealEstateCategory
                                  ? "property type"
                                  : selectedCategory === "2"
                                    ? "car type"
                                    : selectedCategory === "10"
                                      ? "bike type"
                                      : "subcategory"
                            }`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategoryData.subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="condition">Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => handleInputChange("condition", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="second_hand">Second Hand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Price Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="negotiable"
                      checked={formData.negotiable}
                      onCheckedChange={(checked) => handleInputChange("negotiable", checked)}
                    />
                    <Label htmlFor="negotiable">Price is negotiable</Label>
                  </div>
                </div>
              </div>

              {/* Vehicle Specific Details (Cars and Bikes) - Updated with manufacturing year */}
              {isVehicleCategory && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    {selectedCategory === "2" ? "Car" : "Bike"} Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCategoryBrands.length > 0 && (
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {selectedCategoryBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        placeholder={`e.g., ${selectedCategory === "2" ? "City, Swift" : "Classic 350, Pulsar"}`}
                        value={formData.model}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="kmDriven">KM Driven</Label>
                      <Select value={formData.kmDriven} onValueChange={(value) => handleInputChange("kmDriven", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select KM range" />
                        </SelectTrigger>
                        <SelectContent>
                          {kmDrivenOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="numberOfOwners">Number of Owners</Label>
                      <Select
                        value={formData.numberOfOwners}
                        onValueChange={(value) => handleInputChange("numberOfOwners", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner count" />
                        </SelectTrigger>
                        <SelectContent>
                          {numberOfOwnersOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
                      <Select
                        value={formData.manufacturingYear}
                        onValueChange={(value) => handleInputChange("manufacturingYear", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {manufacturingYearOptions().map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transmissionType">Transmission Type</Label>
                      <Select
                        value={formData.transmissionType}
                        onValueChange={(value) => handleInputChange("transmissionType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1990"
                        max={new Date().getFullYear()}
                        placeholder="e.g., 2023"
                        value={formData.year}
                        onChange={(e) => handleInputChange("year", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Real Estate Specific Details */}
              {isRealEstateCategory && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Property Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => handleInputChange("propertyType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="plot">Plot</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="pg">PG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bhk">BHK</Label>
                      <Select value={formData.bhk} onValueChange={(value) => handleInputChange("bhk", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select BHK" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 BHK</SelectItem>
                          <SelectItem value="2">2 BHK</SelectItem>
                          <SelectItem value="3">3 BHK</SelectItem>
                          <SelectItem value="4+">4+ BHK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Details for other categories */}
              {selectedCategoryBrands.length > 0 && !isVehicleCategory && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Product Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {selectedCategoryBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        placeholder="e.g., iPhone 14 Pro Max"
                        value={formData.model}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Year (for electronics) */}
                  {selectedCategory === "1" && (
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1990"
                        max={new Date().getFullYear()}
                        placeholder="e.g., 2023"
                        value={formData.year}
                        onChange={(e) => handleInputChange("year", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Location Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Location Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleInputChange("state", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => handleInputChange("city", value)}
                      required
                      disabled={!selectedState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Area/Locality *</Label>
                  <Input
                    id="location"
                    required
                    placeholder="e.g., Andheri West, Koramangala, Sector 18"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? "Posting..." : "Post Ad"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
