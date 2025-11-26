// Input validation utilities using Zod
import { z } from "zod"

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address").toLowerCase().trim()

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const titleSchema = z
  .string()
  .min(3, "Title must be at least 3 characters")
  .max(200, "Title must be less than 200 characters")
  .trim()

export const descriptionSchema = z
  .string()
  .max(5000, "Description must be less than 5000 characters")
  .trim()
  .optional()

export const priceSchema = z
  .number()
  .min(0, "Price must be positive")
  .max(10000000, "Price must be less than $10,000,000")
  .optional()
  .nullable()

export const urlSchema = z
  .string()
  .url("Invalid URL")
  .max(2048, "URL too long")
  .optional()
  .nullable()

// Sanitize string inputs
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 10000) // Max length
}

// Sanitize number inputs
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === "number") {
    return isNaN(input) ? null : Math.max(0, input)
  }
  if (typeof input === "string") {
    const parsed = parseFloat(input)
    return isNaN(parsed) ? null : Math.max(0, parsed)
  }
  return null
}

// Validate and sanitize product data
export const productSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  category: z.string().min(1, "Category is required"),
  condition: z.string().min(1, "Condition is required"),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  youtube_url: urlSchema,
  website_url: urlSchema,
  show_mobile_number: z.boolean().optional(),
})

export type ProductInput = z.infer<typeof productSchema>

// Validate API request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      }
    }
    return { success: false, error: "Validation failed" }
  }
}

