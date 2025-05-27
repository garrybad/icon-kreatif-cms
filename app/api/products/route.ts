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

export async function GET() {
  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Format the response to match your desired structure
    const formattedProducts = (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug || createSlug(product.name),
      category: product.category,
      price: product.price,
      description: product.description || "",
      features: product.features || [],
      specifications: product.specifications || {},
      images: product.images || [],
    }))

    const response = NextResponse.json(formattedProducts)

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    return response
  } catch (error) {
    console.error("Error fetching products:", error)
    const response = NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })

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
