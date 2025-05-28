"use client"
import { Package, Eye } from "lucide-react"

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
import { EditProductDialog } from "@/components/dialog-edit-product"
import { DeleteProductDialog } from "@/components/dialog-delete-product"

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

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [message, setMessage] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [editImages, setEditImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  // Edit form states
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [editSpecifications, setEditSpecifications] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup preview URLs
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [newImagePreviews])

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
    setEditSlug(product.slug || createSlug(product.name))
    setEditCategory(product.category)
    setEditPrice(product.price.toString())
    setEditDescription(product.description || "")
    setEditFeatures(product.features || [""])
    setEditSpecifications(
      Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value })) || [{ key: "", value: "" }],
    )
    setEditImages(product.images || [])
    setNewImages([])
    setNewImagePreviews([])
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    if (editName) {
      const generatedSlug = createSlug(editName)
      setEditSlug(generatedSlug)
    }
  }, [editName])

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleEditSuccess = (updatedProduct: Product) => {
    setMessage("Product updated successfully!")
    fetchProducts() // Refresh the list
    setTimeout(() => setMessage(""), 3000)
  }

  const handleEditError = (error: string) => {
    setMessage(error)
    setTimeout(() => setMessage(""), 5000)
  }

  const handleDeleteSuccess = (deletedProduct: Product) => {
    setMessage("Product deleted successfully!")
    setProducts(products.filter((p) => p.id !== deletedProduct.id))
    setTimeout(() => setMessage(""), 3000)
  }

  const handleDeleteError = (error: string) => {
    setMessage(error)
    setTimeout(() => setMessage(""), 5000)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  if (isLoading) {
    return (
      <div>
        <div className="mx-auto">
          <div className="text-center">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manajemen Produk</h1>
            <p className="text-gray-600">Lihat, edit, dan kelola produk Anda</p>
          </div>
          <Link href="/dashboard/products">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambahkan Produk Baru
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
                    <Link href={`/dashboard/products/${product.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
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
        <EditProductDialog
          product={editingProduct}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
          categories={categories}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteProductDialog
          product={productToDelete}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />

      </div>
    </div>
  )
}
