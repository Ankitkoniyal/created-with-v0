import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">MarketPlace</h3>
            <p className="text-muted-foreground mb-4">
              Your trusted marketplace for buying and selling products locally.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Safety Tips
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Categories</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary">
                  Cars
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Electronics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Property
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Fashion
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                support@marketplace.com
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                1-800-MARKET
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 MarketPlace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
