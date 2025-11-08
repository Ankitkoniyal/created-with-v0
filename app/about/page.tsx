import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "About Us - Your Marketplace",
  description: "Learn about Your Marketplace - Canada's fastest growing online marketplace. Our mission, values, and commitment to connecting buyers and sellers.",
  openGraph: {
    title: "About Us - Your Marketplace",
    description: "Learn about Canada's fastest growing online marketplace for buying and selling everything.",
    type: 'website',
    url: '/about',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">About Your Marketplace</h1>
      {/* Your about content */}
    </div>
  )
}
