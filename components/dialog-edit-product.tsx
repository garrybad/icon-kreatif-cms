"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface Product {
  id: number
  name: string
  category: string
  price: number
  description: string
  features: string[]
  specifications: Record<string, string>
  images: string[]
  created_at: string
  slug: string
}

interface EditProductDialogProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProduct: Product) => void
  onError: (error: string) => void
  categories?: string[]
}

export function EditProductDialog({
  product,
  isOpen,
  onClose,
  onSuccess,
  onError,
  categories = [],
}: EditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Form states
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [editSpecifications, setEditSpecifications] = useState<{ key: string; value: string }[]>([])

  // Image states
  const [editImages, setEditImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  // Initialize form when product changes
  useEffect(() => {
    if (product && isOpen) {
      setEditName(product.name)
      setEditSlug(product.slug || createSlug(product.name))
      setEditCategory(product.category)
      setEditPrice(product.price.toString())
      setEditDescription(product.description || "")
      setEditFeatures(product.features || [""])
      setEditSpecifications(
        Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value })) || [
          { key: "", value: "" },
        ],
      )
      setEditImages(product.images || [])
      setNewImages([])
      setNewImagePreviews([])
      setMessage("")
    }
  }, [product, isOpen])

  // Auto-generate slug when name changes
  useEffect(() => {
    if (editName) {
      const generatedSlug = createSlug(editName)
      setEditSlug(generatedSlug)
    }
  }, [editName])

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [newImagePreviews])

  const addEditFeature = () => {
    setEditFeatures([...editFeatures, ""])
  }

  const removeEditFeature = (index: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== index))
  }

  const updateEditFeature = (index: number, value: string) => {
    const newFeatures = [...editFeatures]
    newFeatures[index] = value
    setEditFeatures(newFeatures)
  }

  const addEditSpecification = () => {
    setEditSpecifications([...editSpecifications, { key: "", value: "" }])
  }

  const removeEditSpecification = (index: number) => {
    setEditSpecifications(editSpecifications.filter((_, i) => i !== index))
  }

  const updateEditSpecification = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...editSpecifications]
    newSpecs[index][field] = value
    setEditSpecifications(newSpecs)
  }

  const removeExistingImage = (index: number) => {
    const newEditImages = editImages.filter((_, i) => i !== index)
    setEditImages(newEditImages)
  }

  const addNewImage = (file: File) => {
    setNewImages([...newImages, file])
    setNewImagePreviews([...newImagePreviews, URL.createObjectURL(file)])
  }

  const removeNewImage = (index: number) => {
    const newImagesCopy = newImages.filter((_, i) => i !== index)
    const newPreviewsCopy = newImagePreviews.filter((_, i) => i !== index)

    // Revoke the URL to prevent memory leaks
    if (newImagePreviews[index]) {
      URL.revokeObjectURL(newImagePreviews[index])
    }

    setNewImages(newImagesCopy)
    setNewImagePreviews(newPreviewsCopy)
  }

  const handleSave = async () => {
    if (!product) return

    setIsLoading(true)
    setMessage("")

    try {
      const validFeatures = editFeatures.filter((feature) => feature.trim() !== "")
      const validSpecs = editSpecifications.filter((spec) => spec.key.trim() !== "" && spec.value.trim() !== "")
      const specsObject = validSpecs.reduce(
        (acc, spec) => {
          acc[spec.key] = spec.value
          return acc
        },
        {} as Record<string, string>,
      )

      // Convert new images to base64
      const newImagePromises = newImages.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      })

      const newImageBase64Array = await Promise.all(newImagePromises)
      const allImages = [...editImages, ...newImageBase64Array]

      const updatedData = {
        name: editName,
        slug: editSlug,
        category: editCategory,
        price: Number.parseFloat(editPrice),
        description: editDescription,
        features: validFeatures,
        specifications: specsObject,
        images: allImages,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("products").update(updatedData).eq("id", product.id)

      if (error) {
        throw error
      }

      const updatedProduct = { ...product, ...updatedData }
      onSuccess(updatedProduct)
      onClose()
    } catch (error) {
      console.error("Error updating product:", error)
      setMessage("Error updating product. Please try again.")
      onError("Error updating product. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the product information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="product-slug"
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">This will be used in the URL: /products/{editSlug}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
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

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (IDR) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEditFeature}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
            {editFeatures.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={feature}
                  onChange={(e) => updateEditFeature(index, e.target.value)}
                  placeholder="Enter feature"
                />
                {editFeatures.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeEditFeature(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Specifications</Label>
              {/* <Button type="button" variant="outline" size="sm" onClick={addEditSpecification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button> */}
            </div>
            {editSpecifications.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={spec.key}
                  onChange={(e) => updateEditSpecification(index, "key", e.target.value)}
                  placeholder="Specification name"
                  readOnly
                />
                <Input
                  value={spec.value}
                  onChange={(e) => updateEditSpecification(index, "value", e.target.value)}
                  placeholder="Specification value"
                />
                {/* {editSpecifications.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeEditSpecification(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )} */}
              </div>
            ))}
          </div>

          {/* Image Management */}
          <div className="space-y-4">
            <Label>Product Images</Label>

            {/* Existing Images */}
            {editImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Current Images</h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {editImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square border-2 border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImagePreviews.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">New Images</h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square border-2 border-green-300 rounded-lg overflow-hidden">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Image */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    addNewImage(file)
                  }
                }}
                className="hidden"
                id="add-new-image"
              />
              <label htmlFor="add-new-image">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Image
                  </span>
                </Button>
              </label>
            </div>

            <p className="text-sm text-gray-500">Total images: {editImages.length + newImages.length}</p>
          </div>

          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
