"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Trash2, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { EditProductDialog } from "@/components/dialog-edit-product"
import { DeleteProductDialog } from "@/components/dialog-delete-product"

interface Product {
    id: number
    name: string
    slug: string
    category: string
    price: number
    description: string
    features: string[]
    specifications: Record<string, string>
    images: string[]
    created_at: string
}

function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const router = useRouter()
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
    const { slug } = use(params);

    useEffect(() => {
        fetchProduct()
        fetchCategories()
    }, [slug])

    const fetchProduct = async () => {
        try {
            const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single()

            if (error) {
                if (error.code === "PGRST116") {
                    setError("Product not found")
                    return
                }
                throw error
            }

            setProduct(data)
        } catch (error) {
            console.error("Error fetching product:", error)
            setError("Failed to fetch product details")
        } finally {
            setIsLoading(false)
        }
    }

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price)
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

    const handleEditSuccess = (updatedProduct: Product) => {
        setMessage("Product updated successfully!")
        fetchProduct() // Refresh the list
        setTimeout(() => setMessage(""), 3000)
    }

    const handleEditError = (error: string) => {
        setMessage(error)
        setTimeout(() => setMessage(""), 5000)
    }

    const handleDelete = (product: Product) => {
        setProductToDelete(product)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteSuccess = (deletedProduct: Product) => {
        setMessage("Product deleted successfully!")
        router.push('/dashboard/products/list');
        // setProducts(products.filter((p) => p.id !== deletedProduct.id))
        setTimeout(() => setMessage(""), 3000)
    }

    const handleDeleteError = (error: string) => {
        setMessage(error)
        setTimeout(() => setMessage(""), 5000)
    }

    if (isLoading) {
        return (
            <div>
                <div className="mx-auto">
                    <div className="text-center">Loading product details...</div>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div>
                <div className="mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>{error || "Product not found"}</AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Link href="/dashboard/products/list">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali ke Produk
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="mx-auto">
                {/* Header */}
                <div className="grid sm:flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <Link href="/dashboard/products/list">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Products
                            </Button>
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Ubah Produk
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Images Section */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                {product.images && product.images.length > 0 ? (
                                    <>
                                        {/* Main Image */}
                                        <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Thumbnail Images */}
                                        {product.images.length > 1 && (
                                            <div className="grid grid-cols-5 gap-2">
                                                {product.images.map((image, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                        className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImageIndex === index ? "border-blue-500" : "border-gray-200"
                                                            }`}
                                                    >
                                                        <img
                                                            src={image || "/placeholder.svg"}
                                                            alt={`${product.name} ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Package className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Product Info Section */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{product.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Badge variant="secondary">{product.category}</Badge>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-blue-600">{formatPrice(product.price)}</h2>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Deskripsi</h3>
                                    <p className="text-gray-700">{product.description || "No description available"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        <strong>Slug:</strong> {product.slug}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        <strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Fitur</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {product.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Specifications */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Spesifikasi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                                                <span className="font-medium text-gray-700">{key}</span>
                                                <span className="text-gray-600">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

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
