"use client"

import { toast } from "react-toastify"
import { Stepper } from "@/components/sell/stepper"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, Tag, AlertCircle, Camera } from "lucide-react"
import { CATEGORIES, SUBCATEGORY_MAPPINGS } from "@/lib/categories"
import imageCompression from "browser-image-compression"

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
  imagePreviews: string[]
}

interface DatabaseCategory {
  id: number
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

const conditions = ["New", "Like New", "Good", "Fair", "Poor"]

const mapConditionToDatabase = (condition: string): string => {
  const conditionMap: { [key: string]: string } = {
    "New": "new",
    "Like New": "like_new", 
    "Good": "good",
    "Fair": "fair",
    "Poor": "poor"
  }
  return conditionMap[condition] || "good" // Default to "good" if not found
}

const parseLocation = (location: string): { city: string; province: string } => {
  const parts = location.split(", ")
  const city = parts.length >= 2 ? parts[parts.length - 2] : location
  const province = parts.length >= 2 ? parts[parts.length - 1] : ""
  return { city, province }
}

export function PostProductForm() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1, // Max file size in MB
      maxWidthOrHeight: 1920, // Max width or height
      useWebWorker: true,
    }

    try {
      console.log(`Original image size: ${file.size / 1024 / 1024} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed image size: ${compressedFile.size / 1024 / 1024} MB`);
      return compressedFile;
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("There was an error compressing an image.");
      return null;
    }
  };

  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditMode = !!editId
  
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [categories, setCategories] = useState<DatabaseCategory[]>([])
  const [subcategories, setSubcategories] = useState<DatabaseSubcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<DatabaseSubcategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

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
    showMobileNumber: false,
    tags: [],
    images: [],
    features: [],
    imagePreviews: [],
  })

  const [newFeature, setNewFeature] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const submissionLock = useRef(false)

  // Initialize categories instantly from local data
  useEffect(() => {
    const initializeCategories = () => {
      try {
        console.log("🔄 Initializing categories instantly from local data...")
        
        const categoriesData = CATEGORIES.map((cat, index) => ({
          id: index + 1,
          slug: cat.toLowerCase().replace(/\s+/g, '-'),
          name: cat
        }))
        
        const subcategoriesData: DatabaseSubcategory[] = []
        Object.entries(SUBCATEGORY_MAPPINGS).forEach(([category, subs]) => {
          subs.forEach((sub, index) => {
            subcategoriesData.push({
              id: `${category}-${index}`,
              name: sub,
              slug: sub.toLowerCase().replace(/\s+/g, '-'),
              category_slug: category.toLowerCase().replace(/\s+/g, '-')
            })
          })
        })

        setCategories(categoriesData)
        setSubcategories(subcategoriesData)
        
        console.log("✅ Categories initialized instantly:", categoriesData.length, "categories,", subcategoriesData.length, "subcategories")
        
        // Also try to fetch from database to sync IDs
        fetchDatabaseCategories()
        
      } catch (error) {
        console.error("❌ Error initializing categories:", error)
      }
    }

    const fetchDatabaseCategories = async () => {
      try {
        const supabase = createClient()
        const { data: dbCategories, error } = await supabase
          .from("categories")
          .select("id, slug, name")
          .order("id")

        if (!error && dbCategories && dbCategories.length > 0) {
          console.log("✅ Database categories loaded, using database IDs")
          setCategories(dbCategories)
        } else {
          console.log("ℹ️ Using local categories with generated IDs")
        }
      } catch (error) {
        console.log("ℹ️ Using local categories as fallback")
      }
    }

    initializeCategories()
  }, [])

  // Filter subcategories when category changes
  useEffect(() => {
    if (formData.category && subcategories.length > 0) {
      const filtered = subcategories.filter(
        (subcat) => subcat.category_slug === formData.category
      )
      setFilteredSubcategories(filtered)
    } else {
      setFilteredSubcategories([])
    }
    
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
            price: data.price ? (data.price / 100).toString() : "",
            priceType: data.price_type || (data.price > 0 ? "amount" : "contact"),
            category: data.category_slug || "",
            subcategory: data.subcategory || "",
            condition: data.condition || "",
            brand: data.brand || "",
            model: data.model || "",
            address: data.location || "",
            location: data.city && data.province ? `${data.city}, ${data.province}` : "",
            postalCode: data.postal_code || "",
            youtubeUrl: data.youtube_url || "",
            websiteUrl: data.website_url || "",
            showMobileNumber: false,
            tags: data.tags || [],
            images: [],
            features: data.features || [],
            imagePreviews: data.images || [],
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (formData.images.length + (isEditMode ? formData.imagePreviews.filter(url => !url.startsWith('blob:')).length : 0) + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.")
      return
    }

    setIsUploadingImages(true)
    setUploadProgress(0)

    try {
      const compressedFiles: File[] = []
      const newPreviews: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`)
          continue
        }

        const compressedFile = await compressImage(file)
        if (compressedFile) {
          compressedFiles.push(compressedFile)
          const objectUrl = URL.createObjectURL(compressedFile)
          newPreviews.push(objectUrl)
        }

        setUploadProgress(((i + 1) / files.length) * 100)
      }

      setFormData((prev) => ({ 
        ...prev, 
        images: [...prev.images, ...compressedFiles],
        imagePreviews: [...prev.imagePreviews, ...newPreviews]
      }))

    } catch (error) {
      console.error('Error processing images:', error)
      toast.error('Failed to process some images. Please try again.')
    } finally {
      setIsUploadingImages(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    try {
      const imageUrl = formData.imagePreviews[index]
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
        console.log(`Cleaned up blob URL for image at index ${index}`)
      }
      
      const isNewImage = imageUrl.startsWith('blob:')
      
      setFormData((prev) => ({
        ...prev,
        images: isNewImage 
          ? prev.images.filter((_, i) => i !== prev.imagePreviews.slice(0, index + 1).filter(url => url.startsWith('blob:')).length - 1)
          : prev.images,
        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      }))
      
      console.log(`Image removed at index ${index}`)
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      formData.imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [formData.imagePreviews])

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

  // PRODUCTION-READY SUBMISSION WITH ENHANCED ERROR HANDLING AND LOGGING
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submissionLock.current) {
      console.log("🛑 Blocked duplicate submission")
      return
    }

    // Enhanced validation with detailed logging
    console.log("🚀 Enhanced submission starting with validation...")
    
    if (!user) {
      console.log("❌ User not authenticated")
      toast.error("Please log in to post an ad")
      return
    }

    // Validate required fields
    if (!formData.title.trim()) {
      console.log("❌ Title validation failed")
      toast.error("Please enter a title for your ad")
      return
    }

    if (formData.title.trim().length < 5) {
      console.log("❌ Title too short")
      toast.error("Title must be at least 5 characters long")
      return
    }

    if (!formData.description.trim()) {
      console.log("❌ Description validation failed")
      toast.error("Please enter a description for your ad")
      return
    }

    if (formData.description.trim().length < 10) {
      console.log("❌ Description too short")
      toast.error("Description must be at least 10 characters long")
      return
    }

    if (!formData.category) {
      console.log("❌ Category validation failed")
      toast.error("Please select a category")
      return
    }

    if (!formData.condition) {
      console.log("❌ Condition validation failed")
      toast.error("Please select the condition of your item")
      return
    }

    if (formData.priceType === "amount") {
      if (!formData.price) {
        console.log("❌ Price validation failed - empty")
        toast.error("Please enter a price")
        return
      }
      
      const priceValue = parseFloat(formData.price)
      if (isNaN(priceValue) || priceValue < 0) {
        console.log("❌ Price validation failed - invalid number")
        toast.error("Please enter a valid price")
        return
      }
      
      if (priceValue > 100000) {
        console.log("❌ Price validation failed - too high")
        toast.error("Price cannot exceed $100,000")
        return
      }
    }

    if (!formData.location) {
      console.log("❌ Location validation failed")
      toast.error("Please select your location")
      return
    }

    if (!formData.postalCode) {
      console.log("❌ Postal code validation failed")
      toast.error("Please enter your postal code")
      return
    }

    // Validate Canadian postal code format
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/
    if (!postalCodeRegex.test(formData.postalCode.replace(/\s/g, ''))) {
      console.log("❌ Postal code format validation failed")
      toast.error("Please enter a valid Canadian postal code (e.g., A1A 1A1)")
      return
    }

    // Validate images
    if (formData.images.length === 0 && formData.imagePreviews.filter(url => !url.startsWith('blob:')).length === 0) {
      console.log("❌ Image validation failed")
      toast.error("Please upload at least one image")
      return
    }

    console.log("✅ All validations passed, proceeding with submission...")
    submissionLock.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      if (!supabase) throw new Error("Service unavailable")

      console.log("📤 Starting parallel image upload process...")
      let imageUrls: string[] = []

      if (formData.images.length > 0) {
        console.log(`📤 Uploading ${formData.images.length} images in parallel to Supabase Storage...`)

        const uploadPromises = formData.images.map(async (file, i) => {
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
          const fileName = `${user.id}/${Date.now()}-${i}-${sanitizedFileName}`

          try {
            console.log(`📤 Uploading image ${i + 1}: ${fileName}`)

            const { data, error } = await supabase.storage
              .from("product-images")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
              })

            if (error) {
              console.error(`❌ Failed to upload image ${i + 1}:`, error)
              toast.error(`Failed to upload image ${i + 1}: ${error.message}`)
              return null
            }

            if (data) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("product-images").getPublicUrl(fileName)

              console.log(`✅ Image ${i + 1} uploaded successfully: ${publicUrl}`)
              return publicUrl
            }
            return null
          } catch (uploadError) {
            console.error(`❌ Image upload error ${i + 1}:`, uploadError)
            toast.error(`Image upload failed for image ${i + 1}`)
            return null
          }
        })

        const results = await Promise.all(uploadPromises)
        imageUrls = results.filter((url): url is string => url !== null)

        if (imageUrls.length !== formData.images.length) {
          console.warn("Some images failed to upload.")
          toast.warn("Some images could not be uploaded. Please check and try again.")
        }
      }

      // Keep existing images from edit mode
      if (isEditMode) {
        const existingUrls = formData.imagePreviews.filter(url => !url.startsWith('blob:'))
        imageUrls = [...existingUrls, ...imageUrls]
        console.log(`📸 Kept ${existingUrls.length} existing images, ${imageUrls.length} total`)
      }

      if (imageUrls.length === 0) {
        throw new Error("No images were successfully uploaded")
      }

      // PREPARE DATA - ALIGN WITH DATABASE SCHEMA
      const { city, province } = parseLocation(formData.location)
      
      let categoryId = 1
      let categoryName = formData.category

      if (formData.category) {
        const foundCategory = categories.find(cat => cat.slug === formData.category)
        if (foundCategory) {
          categoryId = foundCategory.id
          categoryName = foundCategory.name
        }
      }

      let finalPrice = 0
      if (formData.priceType === "amount" && formData.price) {
        const priceValue = parseFloat(formData.price)
        if (!isNaN(priceValue) && priceValue >= 0) {
          finalPrice = priceValue // Store as decimal, not cents
        }
      }

      console.log("💾 Preparing product data for database...")
      
      // PROPER PRODUCT DATA STRUCTURE MATCHING DATABASE
      const productData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: finalPrice,
        condition: mapConditionToDatabase(formData.condition),
        location: formData.location,
        province: province || city || "Unknown",
        city: city || "Unknown",
        images: imageUrls,
        category_id: categoryId,
        // Add optional fields only if they have values
        ...(formData.brand && { brand: formData.brand.trim() }),
        ...(formData.model && { model: formData.model.trim() }),
        ...(formData.subcategory && { subcategory: formData.subcategory }),
        ...(formData.youtubeUrl && { youtube_url: formData.youtubeUrl.trim() }),
        ...(formData.websiteUrl && { website_url: formData.websiteUrl.trim() }),
        ...(formData.tags.length > 0 && { tags: formData.tags }),
        ...(formData.features.length > 0 && { features: formData.features }),
      }

      console.log("💾 Saving product to database...", {
        title: productData.title,
        category_id: productData.category_id,
        price: productData.price,
        images_count: productData.images.length,
        location: productData.location
      })
      
      // DATABASE OPERATION
      let result
      if (isEditMode) {
        console.log(`✏️ Updating existing product: ${editId}`)
        result = await supabase
          .from("products")
          .update({
            ...productData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editId)
          .eq("user_id", user.id)
      } else {
        console.log("➕ Creating new product...")
        result = await supabase
          .from("products")
          .insert([productData])
      }
      
      if (result.error) {
        console.error("❌ Database error:", result.error)
        throw new Error(`Failed to save product: ${result.error.message}`)
      }

      if (!result.data || result.data.length === 0) {
        throw new Error("No data returned from database operation")
      }

      console.log("✅ PRODUCT PUBLISHED SUCCESSFULLY!", result.data)
      
      toast.success(isEditMode ? "✅ Ad updated successfully!" : "🎉 Ad published successfully!")

      // SUCCESS REDIRECT
      setTimeout(() => {
        router.push(isEditMode ? "/dashboard/listings" : "/sell/success")
      }, 1000)

    } catch (error: any) {
      console.error("❌ Submission error:", error)
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
      
      const errorMessage = error?.message || "Failed to publish ad. Please try again."
      setSubmitError(errorMessage)
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
      submissionLock.current = false
      console.log("🔓 Submission lock released")
    }
  }

  // ENHANCED VALIDATION WITH PROPER ERROR MESSAGES
  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.push("Title is required")
        if (formData.title.trim().length < 5) errors.push("Title must be at least 5 characters")
        if (formData.title.trim().length > 100) errors.push("Title must be less than 100 characters")
        if (!formData.description.trim()) errors.push("Description is required")
        if (formData.description.trim().length < 10) errors.push("Description must be at least 10 characters")
        if (formData.description.trim().length > 2000) errors.push("Description must be less than 2000 characters")
        break
        
      case 2:
        if (!formData.category) errors.push("Category is required")
        if (!formData.condition) errors.push("Condition is required")
        if (formData.priceType === "amount" && !formData.price) errors.push("Price is required for 'Set Price' option")
        if (formData.priceType === "amount" && formData.price) {
          const priceValue = parseFloat(formData.price)
          if (isNaN(priceValue) || priceValue < 0) errors.push("Price must be a valid positive number")
          if (priceValue > 100000) errors.push("Price cannot exceed $100,000")
        }
        break
        
      case 3:
        // Step 3 is optional (additional details), but validate URLs if provided
        if (formData.youtubeUrl && !isValidUrl(formData.youtubeUrl)) errors.push("YouTube URL is invalid")
        if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) errors.push("Website URL is invalid")
        break
        
      case 4:
        if (!formData.location) errors.push("Location is required")
        if (!formData.postalCode) errors.push("Postal code is required")
        if (formData.postalCode && !isValidCanadianPostalCode(formData.postalCode)) {
          errors.push("Please enter a valid Canadian postal code (e.g., A1A 1A1)")
        }
        break
    }
    
    return { isValid: errors.length === 0, errors }
  }

  // Helper functions for validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidCanadianPostalCode = (postalCode: string): boolean => {
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase()
    return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)
  }

  const handleNextStep = () => {
    const validation = validateStep(currentStep)
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error))
      return
    }
    setCurrentStep(prev => Math.min(4, prev + 1))
  }

  // Enhanced validation for final submission
  const isStep1Valid = formData.title.trim().length >= 5 && formData.description.trim().length >= 10
  const isStep2Valid = formData.category && formData.condition && 
    (formData.priceType !== "amount" || (formData.price && parseFloat(formData.price) >= 0 && parseFloat(formData.price) <= 100000))
  const isStep3Valid = true // Optional step
  const isStep4Valid = formData.location && formData.postalCode && isValidCanadianPostalCode(formData.postalCode)

  const canProceed =
    currentStep === 1 ? isStep1Valid : 
    currentStep === 2 ? isStep2Valid : 
    currentStep === 3 ? isStep3Valid : 
    isStep4Valid

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
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl border bg-card text-card-foreground">
        <div className="p-6">
          {submitError && (
            <Alert variant="destructive" className="mb-4">
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

          {/* Step 1 - Basic Info & Images */}
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
                    placeholder="Enter a clear title for your item"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    placeholder="Describe your item in detail. Its condition, features, and any relevant information for buyers."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">
                    Add up to 5 photos (max 3MB each). The first photo will be your main image.
                  </p>
                  {isUploadingImages && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                      {uploadProgress > 0 && (
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <section aria-labelledby="photos" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {formData.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg border bg-background aspect-square">
                        <div className="w-full overflow-hidden">
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error(`Failed to load image: ${preview}`)
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-red-500 hover:bg-red-600 text-white p-1 transition-colors shadow-lg"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {formData.imagePreviews.length < 5 && !isUploadingImages && (
                      <label
                        htmlFor="add-photo-input"
                        className="relative overflow-hidden rounded-lg border-2 border-dashed border-green-600 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer aspect-square flex items-center justify-center dark:bg-green-900/20 dark:border-green-400 dark:hover:bg-green-900/30"
                      >
                        <div className="text-center">
                          <div className="mx-auto mb-2 h-10 w-10 rounded-full border-2 border-green-600 grid place-items-center text-green-600 dark:border-green-400 dark:text-green-400">
                            <Camera className="h-5 w-5" />
                          </div>
                          <p className="text-sm text-green-700 font-medium dark:text-green-300">Add Photos</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Max 3MB</p>
                        </div>
                        <input
                          id="add-photo-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleImageUpload}
                          disabled={isUploadingImages}
                        />
                      </label>
                    )}
                  </div>
                  {formData.imagePreviews.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.imagePreviews.length}/5 photos added
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* Step 2 - Category & Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-foreground">
                      Category *
                    </label>
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
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subcategory" className="block text-sm font-medium text-foreground">
                      Subcategory
                    </label>
                    <select
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange("subcategory", e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                      disabled={!formData.category || filteredSubcategories.length === 0}
                    >
                      <option value="">Select subcategory</option>
                      {filteredSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.slug}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
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
                      onChange={(e) => handleInputChange("priceType", e.target.value as ProductFormData["priceType"])}
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
                      onChange={(e) => {
                        const value = e.target.value
                        if (value) {
                          const numValue = parseFloat(value)
                          if (numValue > 100000) {
                            toast.error("Price cannot exceed $100,000")
                            return
                          }
                          if (numValue < 0) {
                            toast.error("Price cannot be negative")
                            return
                          }
                        }
                        handleInputChange("price", value)
                      }}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                      min="0"
                      max="100000"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Enter price in dollars (max: $100,000)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 - Additional Details */}
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
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
                <label className="flex items-center text-base font-semibold text-foreground">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags (Max 5 words)
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-l-md focus:border-primary focus:outline-none bg-background text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      disabled={formData.tags.length >= 5}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={!newTag.trim() || formData.tags.length >= 5}
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4 border-2 border-border rounded-lg bg-background">
                <label className="flex items-center text-base font-semibold text-foreground">
                  Features
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter a feature..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-l-md focus:border-primary focus:outline-none bg-background text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addFeature()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={!newFeature.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Location */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-foreground">
                    Street Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Enter your street address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Your address will not be shown publicly</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="location" className="block text-sm font-medium text-foreground">
                      City & Province *
                    </label>
                    <select
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                      required
                    >
                      <option value="">Select your location *</option>
                      {CANADIAN_LOCATIONS.map((provinceData) => (
                        <optgroup key={provinceData.province} label={provinceData.province}>
                          {provinceData.cities.map((city) => (
                            <option key={city} value={`${city}, ${provinceData.province}`}>
                              {city}, {provinceData.province}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="postalCode" className="block text-sm font-medium text-foreground">
                      Postal Code *
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      placeholder="A1A 1A1 *"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border-2 border-border rounded-md focus:border-primary focus:outline-none bg-background text-foreground"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                disabled={isSubmitting}
              >
                ← Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceed || isSubmitting}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-auto"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImages || !isStep4Valid}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 ml-auto"
              >
                {isSubmitting || isUploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isUploadingImages ? 'Uploading Images...' : isEditMode ? 'Updating...' : 'Publishing...'}
                  </>
                ) : (
                  ` ${isEditMode ? "Update Ad" : "Publish Ad Now"}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
