// app/create-ad/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabaseClient"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/image-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function CreateAdForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(""); // For category_id
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [files, setFiles] = useState<File[]>([]); // State for File objects
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create an ad.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload images to Cloudinary
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append("file", file);

        return fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            return data.url;
          } else {
            throw new Error(data.error || "Image upload failed.");
          }
        });
      });

      const imageUrls = await Promise.all(uploadPromises);

      // 2. Insert ad data with image URLs into Supabase
      const { data, error } = await supabase.from("ads").insert({
        title,
        description,
        price: parseFloat(price),
        category_id: category, // Assuming category state holds the category UUID
        user_id: user.id,
        images: imageUrls, // Store Cloudinary URLs
        location,
        condition,
        // status will default to 'active' in DB
        // created_at and updated_at will default to NOW() in DB
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Your ad has been created successfully!",
      });

      router.push("/"); // Redirect to homepage or ad listing
    } catch (error: any) {
      console.error("Ad creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create a New Ad</CardTitle>
          <CardDescription>
            Fill out the details below to post your ad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            
            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {/* You'll need to fetch real categories from your 'categories' table */}
                  <SelectItem value="c1">Electronics</SelectItem>
                  <SelectItem value="c2">Vehicles</SelectItem>
                  <SelectItem value="c3">Home & Garden</SelectItem>
                  <SelectItem value="c4">Fashion</SelectItem>
                  <SelectItem value="c5">Services</SelectItem>
                  {/* ... more categories */}
                </SelectContent>
              </Select>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New Delhi, India"
                required
              />
            </div>

            {/* Condition Select */}
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={condition} onValueChange={setCondition} required>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="second_hand">Second Hand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload files={files} onFilesChange={setFiles} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Post Ad"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}