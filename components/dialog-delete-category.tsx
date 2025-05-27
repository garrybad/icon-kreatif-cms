"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
// import type { Category } from "@/types/category"

interface Category {
  id: number
  name: string
  created_at: string
}

interface DeleteCategoryDialogProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (deletedCategory: Category) => void
  onError: (error: string) => void
}

export function DeleteCategoryDialog({ category, isOpen, onClose, onSuccess, onError }: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!category) return

    setIsDeleting(true)

    try {
      // Check if category is being used by any products
      const { data: productsUsingCategory } = await supabase
        .from("products")
        .select("id")
        .eq("category", category.name)
        .limit(1)

      if (productsUsingCategory && productsUsingCategory.length > 0) {
        onError(`Cannot delete category "${category.name}" because it is being used by products.`)
        setIsDeleting(false)
        return
      }

      const { error } = await supabase.from("categories").delete().eq("id", category.id)

      if (error) {
        throw error
      }

      onSuccess(category)
      onClose()
    } catch (error) {
      console.error("Error deleting category:", error)
      onError("Failed to delete category. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the category "{category?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 pt-4">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
            {isDeleting ? "Deleting..." : "Delete Category"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
