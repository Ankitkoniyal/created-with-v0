import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
})

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-$$$$]+$/, "Please enter a valid phone number")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
})

export const productSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title too long")
    .regex(/^[a-zA-Z0-9\s\-.,!]+$/, "Title contains invalid characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description too long"),
  price: z.number().min(0, "Price cannot be negative").max(1000000, "Price too high"),
  category: z.string().min(1, "Category is required"),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
  brand: z.string().max(50, "Brand name too long").optional(),
  model: z.string().max(50, "Model name too long").optional(),
  location: z.string().min(1, "Location is required"),
  postalCode: z.string().regex(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, "Please enter a valid Canadian postal code"),
  youtubeUrl: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  tags: z.array(z.string().max(20, "Tag too long")).max(5, "Maximum 5 tags allowed"),
})

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const maxSize = 2 * 1024 * 1024 // 2MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and WebP images are allowed" }
  }

  if (file.size > maxSize) {
    return { valid: false, error: "Image must be smaller than 2MB" }
  }

  return { valid: true }
}

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, "")
}
