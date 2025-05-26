import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("business_details").select("whatsapp, address, email").limit(1).single()

    if (error) {
      // If no data exists, return default empty values
      if (error.code === "PGRST116") {
        const response = NextResponse.json({
          whatsapp_number: "",
          address: "",
          email: "",
        })

        // Add CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*")
        response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.set("Access-Control-Allow-Headers", "Content-Type")

        return response
      }
      throw error
    }

    // Format the response to match your desired structure
    const formattedData = {
      whatsapp_number: data.whatsapp || "",
      address: data.address || "",
      email: data.email || "",
    }

    const response = NextResponse.json(formattedData)

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    return response
  } catch (error) {
    console.error("Error fetching business details:", error)
    const response = NextResponse.json({ error: "Failed to fetch business details" }, { status: 500 })

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
