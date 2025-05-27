"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Printer, Phone, Package, Settings, LogOut, Tag } from "lucide-react";
import { Dela_Gothic_One } from "next/font/google";
import { useRouter } from "next/navigation";

const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"], // required
  // display: 'swap', // optional
  weight: "400",
  variable: "--font-dela-gothic-one", // optional: for using as CSS variable
});

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("iconkreatif_auth");
    if (!auth) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("iconkreatif_auth");
    router.push("/");
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Printer className="h-6 w-6 text-purple-600" />
          <span className={`text-xl font-bold ${delaGothicOne.className}`}>
            ICON KREATIF CMS
          </span>
        </Link>

        <nav className="hidden md:flex gap-6 flex-1 justify-end">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Business Details
            </Button>
          </Link>
          <Link href="/dashboard/categories">
            <Button variant="ghost" className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Categories
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
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </nav>

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="outline" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[350px]">
            <div className="flex flex-col gap-6 pt-6">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Printer className="h-6 w-6 text-purple-600" />
                <span
                  className={`text-lg font-bold ${delaGothicOne.className}`}
                >
                  ICON KREATIF CMS
                </span>
              </Link>
              <nav className="flex flex-col gap-4">
                <Link
                  href="/dashboard"
                  className="text-lg font-medium hover:text-purple-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Business Details
                </Link>
                <Link
                  href="/dashboard/categories"
                  className="text-lg font-medium hover:text-purple-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/dashboard/products"
                  className="text-lg font-medium hover:text-purple-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Add Product
                </Link>
                <Link
                  href="/dashboard/products/list"
                  className="text-lg font-medium hover:text-purple-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  View Products
                </Link>
              </nav>
              <Button onClick={handleLogout} className="gap-1 mt-4">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
