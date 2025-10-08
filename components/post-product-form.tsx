"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"
import { Stepper } from "@/components/sell/stepper"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, Tag, AlertCircle } from "lucide-react"

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

interface DatabaseCategory {
  slug: string
  name: string
}

interface DatabaseSubcategory {
  id: string
  name: string
  slug: string
  category_slug: string
}

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

const conditions = ["New", "Like New", "Fair"]

const mapConditionToDatabase = (condition: string): string => {
  const conditionMap: { [key: string]: string } = {
    New: "new",
    "Like New": "like_new", 
    Fair: "fair",
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
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditMode = !!editId
  
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [categories, setCategories] = useState<DatabaseCategory[]>([])
  const [subcategories, setSubcategories] = useState<DatabaseSubcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<DatabaseSubcategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

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
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)

  // Fetch categories and subcategories from Supabase
  useEffect(() => {
    // In the fetchCategories function, add logs:
const fetchCategories = async () => {
  try {
    const supabase = createClient()
    
    console.log("🔄 Fetching categories and subcategories...")
    
    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("slug, name")
      .order("name")

    console.log("📋 Categories fetched:", categoriesData)
    if (categoriesError) console.error("❌ Categories error:", categoriesError)

    setCategories(categoriesData || [])

    // Fetch all subcategories
    const { data: subcategoriesData, error: subcategoriesError } = await supabase
      .from("subcategories")
      .select("id, name, slug, category_slug")
      .order("name")
      .limit(1000) // ⬅️ ADD THIS LINE to fetch more records


       console.log("📋 Subcategories fetched:", subcategoriesData)
       if (subcategoriesError) console.error("❌ Subcategories error:", subcategoriesError)

       setSubcategories(subcategoriesData || [])
      
       }    catch (error) {
           console.error("❌ Error fetching categories:", error)
        } finally {
        setIsLoadingCategories(false)
        }
       }

        fetchCategories()
       },   [])

  // Filter subcategories when category changes
 // Filter subcategories when category changes
     useEffect(() => {
  // ✅ ADD THESE DEBUG LOGS:

  console.log("🔑 Environment check:", {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
}) 
  console.log("🔄 Filtering subcategories for category:", formData.category)
  console.log("📋 All subcategories available:", subcategories)
  
  if (formData.category && subcategories.length > 0) {
    const filtered = subcategories.filter(
      (subcat) => subcat.category_slug === formData.category
    )
    // ✅ ADD THIS LOG:
    console.log("✅ Filtered subcategories:", filtered)
    setFilteredSubcategories(filtered)
  } else {
    // ✅ ADD THIS LOG:
    console.log("❌ No category selected or no subcategories available")
    setFilteredSubcategories([])
  }
  
  
  // Reset subcategory when category changes
  if (formData.category) {
    setFormData(prev => ({ ...prev, subcategory: "" }))
  }
}, [formData.category, subcategories])

  useEffect(() => {
    const fetchExistingProduct = async () => {
      if (!isEditMode || !editId || !user) return

      setIsLoadingEditData(true)
      try {
        const supabase = createClient()
        if (!supabase) {
          console.error("Supabase client unavailable. Skipping edit data fetch.")
          toast.error("Service temporarily unavailable. Please try again in a moment.")
          router.push("/dashboard/listings")
          return
        }
        
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("Error fetching product for edit:", error)
          toast.error("Failed to load product data for editing")
          router.push("/dashboard/listings")
          return
        }

        if (data) {
          setFormData({
            title: data.title || "",
            description: data.description || "",
            price: data.price ? data.price.toString() : "",
            priceType: data.price_type || (data.price > 0 ? "amount" : "contact"),
            category: data.category || "",
            subcategory: data.subcategory || "",
            condition: data.condition || "",
            brand: data.brand || "",
            model: data.model || "",
            address: data.location || "",
            location: data.city && data.province ? `${data.city}, ${data.province}` : "",
            postalCode: data.postal_code || "",
            youtubeUrl: data.youtube_url || "",
            websiteUrl: data.website_url || "",
            showMobileNumber: data.show_mobile_number ?? true,
            tags: data.tags || [],
            images: [],
            features: data.features || [],
          })
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to load product data")
        router.push("/dashboard/listings")
      } finally {
        setIsLoadingEditData(false)
      }
    }

    fetchExistingProduct()
  }, [isEditMode, editId, user, router])
  
  
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
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 3MB per image.`)
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
      console.log(`Starting ${isEditMode ? "ad update" : "ad submission"} process`)

      const supabase = createClient()
      if (!supabase) {
        console.error("Supabase client unavailable. Aborting submission.")
        setSubmitError("Service temporarily unavailable. Please refresh the page or try again shortly.")
        return
      }

      console.log("Supabase client created successfully")

      const imageUrls: string[] = []
      if (formData.images.length > 0) {
        console.log("Uploading images:", formData.images.length)

        for (const image of formData.images) {
          const fileExt = image.name.split(".").pop()
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          console.log("Uploading image:", fileName)

          const { data, error } = await supabase.storage.from("product-images").upload(fileName, image)

          if (error) {
            console.error("Image upload error:", error)
            throw new Error(`Failed to upload image: ${error.message}`)
          }

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName)
          imageUrls.push(urlData.publicUrl)
          console.log("Image uploaded successfully:", urlData.publicUrl)
        }
      }

      const locationParts = parseLocation(formData.location)
      const city = locationParts.city || formData.location.split(",")[0]?.trim() || ""
      const province = locationParts.province || formData.location.split(",")[1]?.trim() || ""

      console.log("Preparing product data...")

        // Find the subcategory ID based on the selected subcategory name
        let subcategoryId = null
        if (formData.subcategory) {
        const selectedSubcategory = filteredSubcategories.find(
          sub => sub.slug === formData.subcategory
        )
        subcategoryId = selectedSubcategory?.id || null
      }
    // Simple category ID mapping - ADD THIS
const categoryIdMap: { [key: string]: number } = {
  'vehicles': 1,
  'electronics': 2,
  'mobile': 3,
  'real-estate': 4,
  'fashion-beauty': 5,
  'home-garden': 6,
  'jobs-services': 7,
  'pets-animals': 8,
  'gaming': 9,
  'books-education': 10,
  'services': 11,
  'sports': 12,
  'other': 13
}

 const categoryId = categoryIdMap[formData.category] || 1

  const productData = {
  user_id: user.id,
  title: formData.title.trim(),
  description: formData.description.trim(),
  price: formData.priceType === "amount" ? Number.parseFloat(formData.price) || 0 : 0,
  price_type: formData.priceType,
  condition: mapConditionToDatabase(formData.condition),
  location: formData.address,
  province: province,
  city: city,
  postal_code: formData.postalCode.trim(),
  images: imageUrls,
  // ✅ USE ACTUAL CATEGORY ID BASED ON SELECTED CATEGORY
  category_id: categoryId, // This uses REAL data from your categories
  // ⬇️⬇️⬇️ ADD THESE 2 LINES RIGHT HERE ⬇️⬇️⬇️
  category_slug: formData.category, // Add this line
  subcategory_slug: formData.subcategory || null,   // Use category as fallback if subcategory empty // Add this line
  // ⬆️⬆️⬆️ ADD THESE 2 LINES RIGHT HERE ⬆️⬆️⬆️
  category: formData.category,
  subcategory: formData.subcategory || null,
  subcategory_id: subcategoryId,
  brand: formData.brand.trim() || null,
  model: formData.model.trim() || null,
  tags: formData.tags.length > 0 ? formData.tags : null,
  youtube_url: formData.youtubeUrl.trim() || null,
  website_url: formData.websiteUrl.trim() || null,
  show_mobile_number: formData.showMobileNumber,
  features: formData.features.length > 0 ? formData.features : null,
  status: "active",
  updated_at: new Date().toISOString(),
  ...(!isEditMode && { created_at: new Date().toISOString() }),
}

      console.log("Product data prepared:", JSON.stringify(productData, null, 2))

      let data, error

      if (isEditMode) {
        console.log("Updating existing product...")
        const result = await supabase
          .from("products")
          .update(productData)
          .eq("id", editId)
          .eq("user_id", user.id)
          .select()
          .single()

        data = result.data
        error = result.error
      } else {
        console.log("Inserting new product...")
        const result = await supabase.from("products").insert(productData).select().single()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error("Database error details:", {
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
          console.error("Missing database column:", error.message)
          setSubmitError(`Database schema issue: ${error.message}. Please run the required database migrations.`)
          return
        } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
          setSubmitError("A similar ad already exists. Please modify your listing and try again.")
          return
        } else {
          setSubmitError(`Failed to ${isEditMode ? "update" : "post"} your ad: ${error.message}. Please try again.`)
          return
        }
      }

      console.log(`Product ${isEditMode ? "updated" : "saved"} successfully:`, data)

      const successMessage = isEditMode
        ? "Your ad has been updated successfully!"
        : "Your ad has been posted successfully!"

      console.log("Redirecting to success page with ID:", data.id)
      sessionStorage.setItem("adPostSuccess", successMessage)

      if (isEditMode) {
        router.push("/dashboard/listings")
      } else {
        router.push(`/sell/success?id=${data.id}`)
      }
    } catch (error) {
      console.error("Submission error details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      setSubmitError(
        `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      )
    } finally {
      setIsSubmitting(false)
      console.log(`${isEditMode ? "Ad update" : "Ad submission"} process completed`)
    }
  }

  const isStep1Valid = formData.images.length > 0 && formData.title.trim() && formData.description.trim()
  const isStep2Valid = formData.category && formData.condition && (formData.priceType !== "amount" || formData.price)
  const isStep3Valid = formData.address && formData.location && formData.postalCode
  const canProceed =
    currentStep === 1 ? isStep1Valid : currentStep === 2 ? isStep2Valid : currentStep === 3 ? isStep3Valid : true

  if (isLoadingEditData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground">
      <div className="p-6">
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{isEditMode ? "Edit Your Listing" : "Create New Listing"}</h2>
          <p className="text-muted-foreground">
            {isEditMode ? "Update your product details" : "Fill in the details to post your ad"}
          </p>
        </div>

        <div className="mb-6">
          <Stepper current={currentStep} total={4} />
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter a clear, descriptive title for your item"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">Be specific about what you're selling</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description *
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your item in detail. Include condition, features, and any relevant information for buyers."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">Provide detailed information to attract buyers</p>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground mb-4">
                Add up to 5 photos (max 3MB each). The first photo will be your main image.
              </p>

              <section aria-labelledby="photos" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative overflow-hidden rounded-lg border bg-background aspect-square">
                      <div className="w-full overflow-hidden">
                        <img
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                          Main
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-red-500 hover:bg-red-600 text-white p-1 transition-colors shadow-lg"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <label
                    htmlFor="add-photo-input"
                    className="relative overflow-hidden rounded-lg border-2 border-dashed border-green-600 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer aspect-square flex items-center justify-center dark:bg-green-900/20 dark:border-green-400 dark:hover:bg-green-900/30"
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-10 w-10 rounded-full border-2 border-green-600 grid place-items-center text-green-600 dark:border-green-400 dark:text-green-400">
                        <i className="fas fa-camera text-lg"></i>
                      </div>
                      <p className="text-sm text-green-700 font-medium dark:text-green-300">Add Photos</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Max 3MB</p>
                    </div>
                  </label>
                  <input
                    id="add-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleImageUpload}
                  />
                </div>
              </section>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-foreground">
                    Category *
                  </label>
                  {isLoadingCategories ? (
                    <div className="w-full px-3 py-2 border-2 border-border rounded-md bg-background">
                      <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="subcategory" className="block text-sm font-medium text-foreground">
                    Subcategory
                  </label>
                      <select
                         id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange("subcategory", e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground" // ← ADD THIS LINE
                    >
                      <option value="">Select subcategory</option>
                      {filteredSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.slug}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  {formData.category && filteredSubcategories.length === 0 && (
                    <p className="text-xs text-muted-foreground">No subcategories available for this category</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="condition" className="text-foreground">Condition *</label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => handleInputChange("condition", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  >
                    <option value="">Select condition</option>
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="brand" className="text-foreground">Brand</label>
                  <input
                    id="brand"
                    placeholder="e.g., Apple, Samsung, Honda"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="priceType" className="text-foreground">Price Type *</label>
                  <select
                    id="priceType"
                    value={formData.priceType}
                    onChange={(e) => handleInputChange("priceType", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  >
                    <option value="amount">Set Price</option>
                    <option value="free">Free</option>
                    <option value="contact">Contact for Price</option>
                    <option value="swap">Swap/Exchange</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="model" className="text-foreground">Model</label>
                  <input
                    id="model"
                    placeholder="e.g., iPhone 14 Pro Max, Galaxy S23"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                </div>
              </div>

              {formData.priceType === "amount" && (
                <div className="space-y-2">
                  <label htmlFor="price" className="text-foreground">Price *</label>
                  <input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
              <label className="text-base font-semibold text-foreground">Additional Links (Optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="youtubeUrl" className="text-foreground">YouTube Video Link</label>
                  <input
                    id="youtubeUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Add a YouTube video showcasing your product</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="websiteUrl" className="text-foreground">Website Link</label>
                  <input
                    id="websiteUrl"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Link to your website or product page</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
              <label className="flex items-center text-base font-semibold text-foreground">
                <Tag className="h-5 w-5 mr-2" />
                Tags (Max 5 words)
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Add relevant keywords to improve your ad's search visibility and help buyers find your item
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
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
                    className="flex-1 px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!newTag.trim() || formData.tags.length >= 5 || formData.tags.includes(newTag.trim())}
                    className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded"
                  >
                    Add
                  </button>
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

            <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
              <label className="text-base font-semibold text-foreground">Key Features (Optional)</label>
              <div className="flex space-x-2">
                <input
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addFeature()}
                  className="flex-1 px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                />
                <button type="button" onClick={addFeature} className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded">
                  Add
                </button>
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

            <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
              <label className="flex items-center text-base font-semibold text-foreground">
                <MapPin className="h-5 w-5 mr-2" />
                Location Details *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="address" className="text-foreground">Street Address *</label>
                  <input
                    id="address"
                    placeholder="e.g., 123 Main Street"
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-foreground">City/Province *</label>
                  <select
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  >
                    <option value="">Select city/province</option>
                    {CANADIAN_LOCATIONS.map((location) => (
                      <optgroup key={location.province} label={location.province}>
                        <option value={location.province} className="font-semibold">
                          {location.province}
                        </option>
                        {location.cities.map((city) => (
                          <option key={city} value={`${city}, ${location.province}`} className="pl-6">
                            {city}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <label htmlFor="postalCode" className="block text-sm font-medium text-foreground">
                    Postal Code *
                  </label>
                  <input
                    id="postalCode"
                    placeholder="e.g., M5V 2T6"
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Product Details</h3>
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
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Tags</h3>
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
                  <h3 className="font-semibold mb-2 text-foreground">Features</h3>
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
                <h3 className="font-semibold mb-2 text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">Photos ({formData.images.length})</h3>
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
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          className="rounded-md bg-gray-500 text-white px-4 py-2 disabled:opacity-50 hover:bg-gray-600"
          disabled={currentStep <= 1}
        >
          Previous
        </button>
        
        {currentStep === 4 ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-green-700 hover:bg-green-800 text-white px-6 py-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Publishing..." : "Publish Ad"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
            className="rounded-md bg-green-700 hover:bg-green-800 text-white px-4 py-2 disabled:opacity-50"
            disabled={!canProceed}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
