// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link 
            href="/" 
            className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Back to Homepage
          </Link>
          <Link 
            href="/search" 
            className="inline-block w-full border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
