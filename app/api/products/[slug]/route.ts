import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
}

function formatPrice(price: number): string {
  // Format as Indonesian Rupiah
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single()

    if (error) {
      if (error.code === "PGRST116") {
        const response = NextResponse.json({ error: "Product not found" }, { status: 404 })

        // Add CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*")
        response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.set("Access-Control-Allow-Headers", "Content-Type")

        return response
      }
      throw error
    }

    // Format the response to match your desired structure
    const formattedProduct = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      price: data.price,
      description: data.description || "",
      features: data.features || [],
      specifications: data.specifications || {},
      images: data.images || [],
    }

    const response = NextResponse.json(formattedProduct)

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    return response
  } catch (error) {
    console.error("Error fetching product:", error)
    const response = NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })

    // Add CORS headers even for errors
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    return response
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
