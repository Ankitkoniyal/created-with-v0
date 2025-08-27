import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
})

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-$$$$]{10,15}$/.test(val), "Please enter a valid phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
})

export const productSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title is too long")
    .regex(/^[a-zA-Z0-9\s\-.,!?()&]+$/, "Title contains invalid characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long")
    .trim(),
  price: z.number().min(0, "Price cannot be negative").max(999999, "Price is too high").optional(),
  priceType: z.enum(["amount", "free", "contact", "swap"]),
  category: z.string().min(1, "Category is required").max(50, "Category name is too long"),
  subcategory: z.string().max(50, "Subcategory name is too long").optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
  brand: z
    .string()
    .max(50, "Brand name is too long")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Brand contains invalid characters")
    .optional(),
  model: z
    .string()
    .max(50, "Model name is too long")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Model contains invalid characters")
    .optional(),
  address: z.string().min(1, "Address is required").max(200, "Address is too long").trim(),
  city: z
    .string()
    .min(1, "City is required")
    .max(50, "City name is too long")
    .regex(/^[a-zA-Z\s\-']+$/, "City contains invalid characters"),
  province: z.string().min(1, "Province is required").max(50, "Province name is too long"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .regex(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, "Please enter a valid Canadian postal code"),
  youtubeUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(val),
      "Please enter a valid YouTube URL",
    ),
  websiteUrl: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+\..+/.test(val), "Please enter a valid website URL"),
  tags: z
    .array(
      z
        .string()
        .max(20, "Tag is too long")
        .regex(/^[a-zA-Z0-9\s-]+$/, "Tag contains invalid characters"),
    )
    .max(5, "Maximum 5 tags allowed"),
  features: z.array(z.string().max(50, "Feature description is too long")).max(10, "Maximum 10 features allowed"),
})

export const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long").trim(),
  productId: z.string().uuid("Invalid product ID"),
  receiverId: z.string().uuid("Invalid receiver ID"),
})

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-$$$$]{10,15}$/.test(val), "Please enter a valid phone number"),
  bio: z.string().max(500, "Bio is too long").optional(),
  location: z.string().max(100, "Location is too long").optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProductInput = z.infer<typeof productSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ProfileInput = z.infer<typeof profileSchema>
