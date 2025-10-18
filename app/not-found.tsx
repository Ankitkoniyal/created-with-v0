import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
            <p className="text-gray-400 mb-6">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
                <Link href="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
