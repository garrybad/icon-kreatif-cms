"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function BusinessDetailsPage() {
  const [whatsapp, setWhatsapp] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchBusinessDetails()
  }, [])

  const fetchBusinessDetails = async () => {
    try {
      const { data, error } = await supabase.from("business_details").select("*").limit(1).single()

      if (error) {
        // If no data exists, that's okay - we'll use empty values
        if (error.code === "PGRST116") {
          console.log("No business details found, using defaults")
          return
        }
        console.error("Error fetching business details:", error)
        return
      }

      if (data) {
        setWhatsapp(data.whatsapp || "")
        setAddress(data.address || "")
        setEmail(data.email || "")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      // First check if any business details exist
      const { data: existingData } = await supabase.from("business_details").select("id").limit(1).single()

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from("business_details")
          .update({
            whatsapp,
            address,
            email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)

        if (error) throw error
      } else {
        // Insert new record
        const { error } = await supabase.from("business_details").insert({
          whatsapp,
          address,
          email,
        })

        if (error) throw error
      }

      setMessage("Business details updated successfully!")
    } catch (error) {
      console.error("Error updating business details:", error)
      setMessage("Error updating business details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Manage your business contact information and details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g., +62812345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your business address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="business@iconkreatif.com"
              />
            </div>

            {message && (
              <Alert
                className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
              >
                <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Business Details"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
