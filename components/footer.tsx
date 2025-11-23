"use client"

import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="text-lg font-bold text-foreground mb-4 block hover:text-primary transition-colors">
              MarketPlace
            </Link>
            <p className="text-muted-foreground mb-4">
              Your trusted marketplace for buying and selling products locally.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" aria-label="Facebook" asChild>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" aria-label="Twitter" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" aria-label="Instagram" asChild>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-primary transition-colors">
                  Sell Your Item
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Browse Ads
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Popular Categories</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/category/vehicles" className="hover:text-primary transition-colors">
                  Vehicles
                </Link>
              </li>
              <li>
                <Link href="/category/electronics" className="hover:text-primary transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/category/real-estate" className="hover:text-primary transition-colors">
                  Real Estate
                </Link>
              </li>
              <li>
                <Link href="/category/fashion-beauty" className="hover:text-primary transition-colors">
                  Fashion & Beauty
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <div className="space-y-3 text-muted-foreground">
              <Link href="/contact" className="flex items-center hover:text-primary transition-colors">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>support@marketplace.com</span>
              </Link>
              <Link href="/contact" className="flex items-center hover:text-primary transition-colors">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>1-800-MARKET</span>
              </Link>
              <div className="pt-2">
                <Link href="/auth/login" className="text-sm hover:text-primary transition-colors block">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="text-sm hover:text-primary transition-colors block mt-1">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <p>&copy; {currentYear} MarketPlace. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/sell" className="hover:text-primary transition-colors">
                Sell on MarketPlace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
