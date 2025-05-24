"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AddProductPage() {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [features, setFeatures] = useState<string[]>([""])
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup preview URLs when component unmounts
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviewUrls])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("name").order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        // Set default categories if database fetch fails
        setCategories([
          "Electronics",
          "Furniture",
          "Clothing",
          "Books",
          "Home & Garden",
          "Sports",
          "Toys",
          "Beauty",
          "Automotive",
          "Other",
        ])
        return
      }

      setCategories(data?.map((cat) => cat.name) || [])
    } catch (error) {
      console.error("Error:", error)
      // Fallback to default categories
      setCategories([
        "Electronics",
        "Furniture",
        "Clothing",
        "Books",
        "Home & Garden",
        "Sports",
        "Toys",
        "Beauty",
        "Automotive",
        "Other",
      ])
    }
  }

  const addFeature = () => {
    setFeatures([...features, ""])
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }])
  }

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specifications]
    newSpecs[index][field] = value
    setSpecifications(newSpecs)
  }

  const handleImageUpload = (index: number, file: File | null) => {
    if (!file) return

    const newImages = [...images]
    const newPreviewUrls = [...imagePreviewUrls]

    // If replacing an existing image
    if (index < newImages.length) {
      // Revoke the old preview URL to prevent memory leaks
      if (newPreviewUrls[index]) {
        URL.revokeObjectURL(newPreviewUrls[index])
      }
      newImages[index] = file
      newPreviewUrls[index] = URL.createObjectURL(file)
    } else {
      // Adding a new image
      newImages.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    }

    setImages(newImages)
    setImagePreviewUrls(newPreviewUrls)
  }

  const removeImage = (index: number) => {
    if (images.length > 0) {
      const newImages = images.filter((_, i) => i !== index)
      const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)

      // Revoke the URL to prevent memory leaks
      if (imagePreviewUrls[index]) {
        URL.revokeObjectURL(imagePreviewUrls[index])
      }

      setImages(newImages)
      setImagePreviewUrls(newPreviewUrls)
    }
  }

  const addImageSlot = () => {
    // This just triggers the file input for a new image
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(images.length, file)
      }
    }
    fileInput.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    // Validation
    if (images.length < 5) {
      setMessage("Please upload at least 5 product images.")
      setIsLoading(false)
      return
    }

    const validFeatures = features.filter((feature) => feature.trim() !== "")
    const validSpecs = specifications.filter((spec) => spec.key.trim() !== "" && spec.value.trim() !== "")
    const specsObject = validSpecs.reduce(
      (acc, spec) => {
        acc[spec.key] = spec.value
        return acc
      },
      {} as Record<string, string>,
    )

    try {
      // Convert images to base64 or upload to a storage service
      // For now, we'll convert to base64 for storage in the database
      const imagePromises = images.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      })

      const imageBase64Array = await Promise.all(imagePromises)

      const { error } = await supabase.from("products").insert({
        name,
        category,
        price: Number.parseFloat(price),
        description,
        features: validFeatures,
        specifications: specsObject,
        images: imageBase64Array,
      })

      if (error) {
        throw error
      }

      setMessage("Product added successfully!")

      // Reset form
      setName("")
      setCategory("")
      setPrice("")
      setDescription("")
      setFeatures([""])
      setSpecifications([{ key: "", value: "" }])
      setImages([])
      setImagePreviewUrls([])
    } catch (error) {
      console.error("Error adding product:", error)
      setMessage("Error adding product. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Add a new product to your Icon Kreatif catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (IDR) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter feature"
                  />
                  {features.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeFeature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Specifications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specification
                </Button>
              </div>
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={spec.key}
                    onChange={(e) => updateSpecification(index, "key", e.target.value)}
                    placeholder="Specification name"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    placeholder="Specification value"
                  />
                  {specifications.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeSpecification(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Product Images * (minimum 5 required)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
              <div className="text-sm text-gray-600">Upload high-quality images of your product</div>

              {/* Display uploaded images */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="absolute bottom-2 left-2">
                      {index + 1}
                    </Badge>
                  </div>
                ))}

                {/* Show empty slots for remaining images */}
                {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(images.length, file)
                        }
                      }}
                      className="hidden"
                      id={`image-upload-${images.length + index}`}
                    />
                    <label
                      htmlFor={`image-upload-${images.length + index}`}
                      className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="h-8 w-8 mb-2" />
                      <span className="text-sm">Upload Image</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500">Uploaded: {images.length}/5 minimum required</div>
            </div>

            {message && (
              <Alert
                className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
              >
                <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Adding Product..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
