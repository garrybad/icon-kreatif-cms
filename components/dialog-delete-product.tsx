"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

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

interface DeleteProductDialogProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (deletedProduct: Product) => void
  onError: (error: string) => void
}

export function DeleteProductDialog({ product, isOpen, onClose, onSuccess, onError }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    setIsDeleting(true)

    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id)

      if (error) {
        throw error
      }

      onSuccess(product)
      onClose()
    } catch (error) {
      console.error("Error deleting product:", error)
      onError("Failed to delete product. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{product?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 pt-4">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
            {isDeleting ? "Deleting..." : "Delete Product"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
