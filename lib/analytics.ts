// Analytics utility functions for tracking user interactions

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID!, {
      page_path: url,
    })
  }
}

// Track custom events
export const event = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// E-commerce tracking
export const trackPurchase = (transactionId: string, value: number, currency = "CAD") => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value: value,
      currency: currency,
    })
  }
}

// Product view tracking
export const trackProductView = (productId: string, productName: string, category: string, price: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: "CAD",
      value: price,
      items: [
        {
          item_id: productId,
          item_name: productName,
          category: category,
          price: price,
        },
      ],
    })
  }
}

// Search tracking
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "search", {
      search_term: searchTerm,
      results_count: resultsCount,
    })
  }
}

// Contact seller tracking
export const trackContactSeller = (productId: string, sellerMethod: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "contact_seller", {
      event_category: "engagement",
      event_label: sellerMethod,
      custom_parameters: {
        product_id: productId,
      },
    })
  }
}

// Ad posting tracking
export const trackAdPosted = (category: string, price: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "ad_posted", {
      event_category: "user_action",
      event_label: category,
      value: price,
    })
  }
}
