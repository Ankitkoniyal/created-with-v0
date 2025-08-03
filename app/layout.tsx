// app/layout.tsx
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { WishlistProvider } from "@/components/wishlist-context"

export const metadata = {
  title: "My App",
  description: "Next.js + Supabase Auth",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
