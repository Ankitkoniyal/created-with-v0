import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact Us - Your Marketplace Support",
  description: "Get in touch with Your Marketplace support team. Contact us for help with buying, selling, or any marketplace-related questions.",
  openGraph: {
    title: "Contact Us - Your Marketplace Support",
    description: "Get in touch with our support team for help with buying, selling, or marketplace questions.",
    type: 'website',
    url: '/contact',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      {/* Your contact form/content */}
    </div>
  )
}
