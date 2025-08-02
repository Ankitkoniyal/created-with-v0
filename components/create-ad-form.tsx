// components/create-ad-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/utils/supabaseClient"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters." }).max(100),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(1000),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number.",
  }).optional().or(z.literal("")),
  negotiable: z.boolean().default(false),
  images: z.any().optional(), // Will handle file uploads separately
  condition: z.enum(["new", "like_new", "second_hand"], {
    required_error: "Please select a condition.",
  }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
})

export function CreateAdForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      negotiable: false,
      condition: "second_hand",
      location: "Zirakpur, Punjab",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an ad.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Placeholder for image URLs. In a real scenario, you'd upload images here first.
    const mockImageUrls = [
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549491689-18c1f9f25265?w=600&h=400&fit=crop",
    ]
    
    // Prepare data for Supabase insertion
    const adData = {
      user_id: user.id,
      title: values.title,
      description: values.description,
      price: values.price ? parseFloat(values.price) : null,
      negotiable: values.negotiable,
      condition: values.condition,
      location: values.location,
      images: mockImageUrls,
    }

    // Insert the ad into the 'ads' table
    const { data, error } = await supabase.from("ads").insert(adData).select("id").single()

    if (error) {
      console.error("Supabase insert error:", error)
      toast({
        title: "Submission Error",
        description: `Failed to create ad: ${error.message}`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Success! Redirect to the confirmation page with the new ad's ID
    toast({
      title: "Ad Created!",
      description: "Your ad has been posted successfully.",
    })
    router.push(`/my-ads/confirmation?adId=${data.id}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Vintage Camera for Sale" {...field} />
              </FormControl>
              <FormDescription>
                A catchy and descriptive title helps your ad stand out.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the condition, features, and history of your item."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide as much detail as possible to attract potential buyers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price and Negotiable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="negotiable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-8">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Negotiable</FormLabel>
                  <FormDescription>
                    Allow potential buyers to negotiate the price.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Condition */}
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="second_hand">Second Hand</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Mumbai, Maharashtra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Posting Ad..." : "Post Ad"}
        </Button>
      </form>
    </Form>
  )
}