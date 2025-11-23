import { Metadata } from "next"
import { generateFAQSchema } from "@/lib/seo/structured-data"

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) - Your Marketplace | Help & Support",
  description: "Get answers to common questions about Your Marketplace. Learn how to buy, sell, post ads, contact sellers, and stay safe. Free classifieds forever, secure transactions.",
  keywords: "FAQ, help, support, how to sell, how to buy, marketplace questions, classifieds help, safety tips, buying guide, selling guide",
  openGraph: {
    title: "FAQ - Your Marketplace | Help & Support",
    description: "Get answers to common questions about buying and selling on Your Marketplace. Free classifieds, secure transactions.",
    type: 'website',
    url: '/faq',
    siteName: 'Your Marketplace',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/faq',
  },
}

const faqData = {
  questions: [
    {
      question: "Is Your Marketplace free to use?",
      answer: "Yes! Your Marketplace is 100% free forever. You can post unlimited ads, browse listings, and contact sellers at no cost. No credit card required, no hidden fees. We believe in making buying and selling accessible to everyone.",
    },
    {
      question: "How do I sell items on Your Marketplace?",
      answer: "Selling is easy and takes less than 2 minutes! Click the '+ Sell' button in the header, create a free account (if you don't have one), fill in your product details including title, description, price, category, and location. Upload high-quality photos, add optional YouTube videos or website links, and publish. Your ad goes live instantly and is visible to thousands of buyers across Canada.",
    },
    {
      question: "Is Your Marketplace safe to use?",
      answer: "Yes, Your Marketplace is a verified and secure platform. We have 50K+ trusted users, SSL encryption for all transactions, and comprehensive safety guidelines. Always meet in public places, verify items before buying, never share banking details or passwords, and trust your instincts. Report any suspicious activity immediately.",
    },
    {
      question: "What can I buy and sell on Your Marketplace?",
      answer: "You can buy and sell almost anything: vehicles (cars, motorcycles, boats), electronics (phones, laptops, TVs), furniture, real estate, fashion & beauty items, home appliances, pets & animals, sports equipment, books & education materials, services, and more. We have categories for everything you need.",
    },
    {
      question: "How do I contact a seller?",
      answer: "Click on any product listing to view details, then click 'Contact Seller' to send a message through our secure messaging system. You can also view the seller's profile, ratings, reviews, response time, and member since date before contacting. All communication happens through our platform for your safety.",
    },
    {
      question: "Can I post ads for free forever?",
      answer: "Yes! All ads are completely free forever. No payment required, no credit card needed, no hidden fees. Post as many ads as you want, whenever you want, completely free. We also offer optional premium features like featured listings for sellers who want extra visibility.",
    },
    {
      question: "How do I search for items?",
      answer: "Use our powerful search bar to find items by keyword, or browse by category. You can filter by location (city, province), price range, condition (new, like new, good, fair, poor), category, and more. Save your searches to get email alerts when new matching listings are posted.",
    },
    {
      question: "What makes Your Marketplace different from other platforms?",
      answer: "Your Marketplace is Canada's fastest growing marketplace with 50K+ trusted users and 5K+ active ads. We offer free ads forever (no hidden fees), direct website links for businesses, YouTube video integration for engaging product showcases, verified seller badges, comprehensive safety features, and a user-friendly interface. We're committed to making buying and selling simple, safe, and free.",
    },
    {
      question: "Do I need to create an account to browse?",
      answer: "No, you can browse all listings without creating an account. However, you'll need a free account to contact sellers, post ads, save favorites, and access your dashboard. Creating an account takes less than a minute and is completely free.",
    },
    {
      question: "How do I edit or delete my listing?",
      answer: "Go to your Dashboard, click on 'My Listings', find the listing you want to edit or delete, and use the options menu. You can update photos, description, price, or any other details. You can also mark items as sold or delete listings you no longer need.",
    },
    {
      question: "Can I include videos in my listings?",
      answer: "Yes! You can add YouTube video URLs to your product listings. This helps showcase your products better and increases engagement by up to 300%. Simply paste your YouTube video URL when creating or editing your listing.",
    },
    {
      question: "How do I report a suspicious listing or user?",
      answer: "If you encounter a suspicious listing or user, click the 'Report' button on the listing page or user profile. Our moderation team reviews all reports and takes appropriate action. You can also contact our support team directly for urgent matters.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "Your Marketplace is a classifieds platform - we don't process payments. Buyers and sellers arrange payment methods directly. We recommend meeting in person, inspecting items, and using secure payment methods. Never send money before seeing the item, and be cautious of requests for wire transfers or gift cards.",
    },
    {
      question: "Can businesses use Your Marketplace?",
      answer: "Absolutely! Businesses can create accounts and post listings just like individual sellers. We offer features specifically for businesses including direct website links, multiple listings, and business profile pages. Many businesses use our platform to drive traffic to their websites and increase sales.",
    },
    {
      question: "How do I get more views on my listings?",
      answer: "To get more views: use clear, descriptive titles with keywords; upload high-quality photos (multiple angles); write detailed descriptions; set competitive prices; include YouTube videos; add your website link; respond quickly to messages; and consider featured listings for extra visibility.",
    },
  ],
}

const faqSchema = generateFAQSchema(faqData)

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Get answers to common questions about Your Marketplace
            </p>
          </div>

          <div className="space-y-6">
            {faqData.questions.map((faq, index) => (
              <div
                key={index}
                itemScope
                itemType="https://schema.org/Question"
                className="bg-card border border-border rounded-lg p-6 shadow-sm"
              >
                <h2
                  itemProp="name"
                  className="text-xl font-semibold text-foreground mb-3"
                >
                  {faq.question}
                </h2>
                <div
                  itemScope
                  itemType="https://schema.org/Answer"
                  itemProp="acceptedAnswer"
                >
                  <p
                    itemProp="text"
                    className="text-muted-foreground leading-relaxed"
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-muted border border-border rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Contact our support team.
            </p>
            <a
              href="/contact"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

