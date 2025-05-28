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
import { X, Plus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
}

export default function AddProductPage() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [features, setFeatures] = useState<string[]>([""])
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: "Bahan", value: "" },
    { key: "Ukuran", value: "" },
    { key: "Type Printing", value: "" },
    { key: "Opsi Finishing", value: "" },
    { key: "Minimal Order", value: "" },
  ])
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
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

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name) {
      const generatedSlug = createSlug(name)
      setSlug(generatedSlug)
    } else {
      setSlug("")
    }
  }, [name])

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

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specifications]
    newSpecs[index][field] = value
    setSpecifications(newSpecs)
  }

  const handleImageUpload = (index: number, file: File | null) => {
    if (!file) return

    const newImages = [...images]
    const newPreviewUrls = [...imagePreviewUrls]
    const newProgress = [...uploadProgress]

    // If replacing an existing image
    if (index < newImages.length) {
      // Revoke the old preview URL to prevent memory leaks
      if (newPreviewUrls[index]) {
        URL.revokeObjectURL(newPreviewUrls[index])
      }
      newImages[index] = file
      newPreviewUrls[index] = URL.createObjectURL(file)
      newProgress[index] = 0
    } else {
      // Adding a new image
      newImages.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
      newProgress.push(0)
    }

    setImages(newImages)
    setImagePreviewUrls(newPreviewUrls)
    setUploadProgress(newProgress)
  }

  const removeImage = (index: number) => {
    if (images.length > 0) {
      const newImages = images.filter((_, i) => i !== index)
      const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)
      const newProgress = uploadProgress.filter((_, i) => i !== index)

      // Revoke the URL to prevent memory leaks
      if (imagePreviewUrls[index]) {
        URL.revokeObjectURL(imagePreviewUrls[index])
      }

      setImages(newImages)
      setImagePreviewUrls(newPreviewUrls)
      setUploadProgress(newProgress)
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

  const checkSlugUniqueness = async (slugToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("products").select("id").eq("slug", slugToCheck).single()

      if (error && error.code === "PGRST116") {
        // No product found with this slug, so it's unique
        return true
      }

      // If we found a product with this slug, it's not unique
      return false
    } catch (error) {
      console.error("Error checking slug uniqueness:", error)
      return false
    }
  }

  // Function to upload a single image to Supabase Storage
  const uploadImageToStorage = async (file: File, index: number): Promise<string> => {
    try {
      // Generate a unique filename to prevent collisions
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${slug}/${fileName}`

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

      if (error) {
        throw error
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath)

      // Update progress
      const newProgress = [...uploadProgress]
      newProgress[index] = 100
      setUploadProgress(newProgress)

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    // Validation
    if (images.length < 2) {
      setMessage("Please upload at least 5 product images.")
      setIsLoading(false)
      return
    }

    // Check if slug is unique
    const isSlugUnique = await checkSlugUniqueness(slug)
    if (!isSlugUnique) {
      setMessage("Product with this name already exists. Please use a different name.")
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
      // Initialize progress array
      const newProgress = images.map(() => 0)
      setUploadProgress(newProgress)

      // Upload all images to Supabase Storage and get their URLs
      const imageUploadPromises = images.map((file, index) => uploadImageToStorage(file, index))
      const imageUrls = await Promise.all(imageUploadPromises)

      // Insert the product with image URLs
      const { error } = await supabase.from("products").insert({
        name,
        slug,
        category,
        price: Number.parseFloat(price),
        description,
        features: validFeatures,
        specifications: specsObject,
        images: imageUrls,
      })

      if (error) {
        throw error
      }

      setMessage("Product added successfully!")

      // Reset form
      setName("")
      setSlug("")
      setCategory("")
      setPrice("")
      setDescription("")
      setFeatures([""])
      setSpecifications([
        { key: "Material", value: "" },
        { key: "Size", value: "" },
        { key: "Printing", value: "" },
        { key: "Finish Options", value: "" },
        { key: "Minimum Order", value: "" },
      ])
      setImages([])
      setImagePreviewUrls([])
      setUploadProgress([])
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
          <CardTitle>Tambah Produk Baru</CardTitle>
          <CardDescription>Tambahkan produk baru ke katalog Icon Kreatif Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (Dibuat Secara Otomatis)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="product-slug"
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">Ini akan digunakan di URL: /products/{slug}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
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

            <div className="space-y-2">
              <Label htmlFor="price">Harga (IDR) *</Label>
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
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan deskripsi produk"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fitur</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambahkan Fitur
                </Button>
              </div>
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Masukkan fitur"
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
                <Label>Spesifikasi</Label>
              </div>
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={spec.key} placeholder="Specification name" readOnly />
                  <Input
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    placeholder="Specification value"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Gambar Produk * (minimal 2 dibutuhkan)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambahkan Gambar
                </Button>
              </div>
              <div className="text-sm text-gray-600">Unggah gambar produk Anda yang berkualitas tinggi</div>

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
                      {isLoading && uploadProgress[index] < 100 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="absolute bottom-2 left-2">
                      {index + 1}
                    </Badge>
                  </div>
                ))}

                {/* Show empty slots for remaining images */}
                {Array.from({ length: Math.max(0, 2 - images.length) }).map((_, index) => (
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
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`image-upload-${images.length + index}`}
                      className={`cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Plus className="h-8 w-8 mb-2" />
                      <span className="text-sm">Unggah Gambar</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500">Diunggah: {images.length}/2 minimum yang diperlukan</div>
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang Menambahkan Produk...
                </>
              ) : (
                "Tambahkan Produk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
