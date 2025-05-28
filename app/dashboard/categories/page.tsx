"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { EditCategoryDialog } from "@/components/dialog-edit-category"
import { DeleteCategoryDialog } from "@/components/dialog-delete-category"

interface Category {
  id: number
  name: string
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")

  // Add category form
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Edit dialog
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Delete dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setMessage("Error fetching categories. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategoryName.trim()) {
      setMessage("Category name is required")
      return
    }

    setIsAdding(true)
    setMessage("")

    try {
      // Check if category already exists
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", newCategoryName.trim())
        .single()

      if (existingCategory) {
        setMessage("Category already exists")
        setIsAdding(false)
        return
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({ name: newCategoryName.trim() })
        .select()
        .single()

      if (error) {
        throw error
      }

      setCategories([...categories, data])
      setNewCategoryName("")
      setMessage("Category added successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error adding category:", error)
      setMessage("Error adding category. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleEditSuccess = (updatedCategory: Category) => {
    setCategories(categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)))
    setMessage("Category updated successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handleEditError = (error: string) => {
    setMessage(error)
    setTimeout(() => setMessage(""), 5000)
  }

  const handleDeleteSuccess = (deletedCategory: Category) => {
    setCategories(categories.filter((cat) => cat.id !== deletedCategory.id))
    setMessage("Category deleted successfully!")
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
          <div className="text-center">Loading categories...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
          <p className="text-gray-600">Tambahkan, edit, dan kelola kategori produk</p>
        </div>

        {message && (
          <Alert
            className={
              message.includes("Error") || message.includes("Cannot")
                ? "border-red-200 bg-red-50 mb-6"
                : "border-green-200 bg-green-50 mb-6"
            }
          >
            <AlertDescription
              className={message.includes("Error") || message.includes("Cannot") ? "text-red-800" : "text-green-800"}
            >
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Category Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Tambah Kategori Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Nama Kategori *</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Masukka nama kategori"
                      disabled={isAdding}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isAdding || !newCategoryName.trim()}>
                    {isAdding ? "Menambahkan..." : "Tambah Kategori"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Daftar Kategori ({categories.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                    <p className="text-gray-600">Start by adding your first category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-sm">
                            {category.name}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Category Dialog */}
        <EditCategoryDialog
          category={editingCategory}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />

        {/* Delete Category Dialog */}
        <DeleteCategoryDialog
          category={deletingCategory}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      </div>
    </div>
  )
}
