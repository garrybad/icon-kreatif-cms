"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
// import type { Category } from "@/types/category"

interface Category {
  id: number
  name: string
  created_at: string
}

interface EditCategoryDialogProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedCategory: Category) => void
  onError: (error: string) => void
}

export function EditCategoryDialog({ category, isOpen, onClose, onSuccess, onError }: EditCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (category && isOpen) {
      setName(category.name)
      setMessage("")
    }
  }, [category, isOpen])

  const handleSave = async () => {
    if (!category || !name.trim()) {
      setMessage("Category name is required")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      // Check if category name already exists (excluding current category)
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", name.trim())
        .neq("id", category.id)
        .single()

      if (existingCategory) {
        setMessage("Category name already exists")
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", category.id)

      if (error) {
        throw error
      }

      const updatedCategory: Category = {
        ...category,
        name: name.trim(),
      }

      onSuccess(updatedCategory)
      onClose()
    } catch (error) {
      console.error("Error updating category:", error)
      setMessage("Error updating category. Please try again.")
      onError("Error updating category. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update the category name</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              disabled={isLoading}
            />
          </div>

          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={isLoading || !name.trim()} className="flex-1">
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
