"use client"
import { Package } from "lucide-react" // Import Package component

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

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
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [message, setMessage] = useState("")
  const [categories, setCategories] = useState<string[]>([])

  // Edit form states
  const [editName, setEditName] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [editSpecifications, setEditSpecifications] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching products:", error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("name").order("name")

      if (error) {
        console.error("Error fetching categories:", error)
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditName(product.name)
    setEditCategory(product.category)
    setEditPrice(product.price.toString())
    setEditDescription(product.description || "")
    setEditFeatures(product.features || [""])
    setEditSpecifications(
      Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value })) || [{ key: "", value: "" }],
    )
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", productToDelete.id)

      if (error) {
        throw error
      }

      setMessage("Product deleted successfully!")
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error("Error deleting product:", error)
      setMessage("Error deleting product. Please try again.")
    }
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return

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

      const { error } = await supabase
        .from("products")
        .update({
          name: editName,
          category: editCategory,
          price: Number.parseFloat(editPrice),
          description: editDescription,
          features: validFeatures,
          specifications: specsObject,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id)

      if (error) {
        throw error
      }

      setMessage("Product updated successfully!")
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      fetchProducts() // Refresh the list
    } catch (error) {
      console.error("Error updating product:", error)
      setMessage("Error updating product. Please try again.")
    }
  }

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-gray-600">View, edit, and manage your products</p>
          </div>
          <Link href="/dashboard/products">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </Link>
        </div>

        {message && (
          <Alert
            className={
              message.includes("Error") ? "border-red-200 bg-red-50 mb-6" : "border-green-200 bg-green-50 mb-6"
            }
          >
            <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first product to the catalog</p>
              <Link href="/dashboard/products">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2">{product.category}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(product.price)}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <Button type="button" variant="outline" size="sm" onClick={addEditSpecification}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </div>
                {editSpecifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={spec.key}
                      onChange={(e) => updateEditSpecification(index, "key", e.target.value)}
                      placeholder="Specification name"
                    />
                    <Input
                      value={spec.value}
                      onChange={(e) => updateEditSpecification(index, "value", e.target.value)}
                      placeholder="Specification value"
                    />
                    {editSpecifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeEditSpecification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 pt-4">
              <Button variant="destructive" onClick={confirmDelete} className="flex-1">
                Delete Product
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
