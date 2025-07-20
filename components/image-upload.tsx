"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Upload, Camera } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      if (file.type.startsWith("image/") && images.length < maxImages) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          onImagesChange([...images, imageUrl])
        }
        reader.readAsDataURL(file)
      }
    })

    // Reset the input so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Product Images</h3>
        <span className="text-xs text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Existing Images */}
        {images.map((image, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-0">
              <div
                className="aspect-square flex flex-col items-center justify-center text-gray-500 hover:text-blue-500 transition-colors"
                onClick={triggerFileInput}
              >
                <Camera className="h-8 w-8 mb-2" />
                <span className="text-xs text-center">Add Photo</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={images.length >= maxImages}
          className="w-full md:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images ({images.length}/{maxImages})
        </Button>
      </div>

      {/* Hidden File Input - Fixed to allow multiple files */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {/* Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Upload up to {maxImages} high-quality images</p>
        <p>• Supported formats: JPG, PNG, GIF</p>
        <p>• First image will be used as the main photo</p>
        <p>• You can select multiple images at once</p>
      </div>
    </div>
  )
}
