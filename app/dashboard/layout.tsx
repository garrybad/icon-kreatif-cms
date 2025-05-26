"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Package, Settings, LogOut, Printer } from "lucide-react"
import { Dela_Gothic_One } from 'next/font/google'
import Navbar from "@/components/navbar"

const delaGothicOne = Dela_Gothic_One({
  subsets: ['latin'], // required
  // display: 'swap', // optional
  weight: '400',
  variable: '--font-dela-gothic-one', // optional: for using as CSS variable
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  // const router = useRouter()

  // useEffect(() => {
  //   const auth = localStorage.getItem("iconkreatif_auth")
  //   if (!auth) {
  //     router.push("/")
  //   } else {
  //     setIsAuthenticated(true)
  //   }
  // }, [router])

  // const handleLogout = () => {
  //   localStorage.removeItem("iconkreatif_auth")
  //   router.push("/")
  // }

  // if (!isAuthenticated) {
  //   return <div>Loading...</div>
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Printer className="h-6 w-6 text-purple-600" />
              <span className={`ml-2 text-xl font-bold text-gray-900 ${delaGothicOne.className}`}>ICON KREATIF CMS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Business Details
                </Button>
              </Link>
              <Link href="/dashboard/products">
                <Button variant="ghost" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/dashboard/products/list">
                <Button variant="ghost" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  View Products
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav> */}
      <main className="container mx-auto py-10 px-4 md:px-6">{children}</main>
    </div>
  )
}
