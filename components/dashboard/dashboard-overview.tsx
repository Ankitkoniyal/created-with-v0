"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, Eye, Plus, MessageSquare } from "lucide-react"
import Link from "next/link"

// Mock data for dashboard stats
const stats = [
  {
    title: "Active Listings",
    value: "3",
    change: "+1 this week",
    icon: Package,
    color: "text-blue-600",
  },
  {
    title: "Total Views",
    value: "1,247",
    change: "+12% from last week",
    icon: Eye,
    color: "text-green-600",
  },
  {
    title: "Messages",
    value: "8",
    change: "2 unread",
    icon: MessageSquare,
    color: "text-purple-600",
  },
  {
    title: "Ads Value", // Updated from "Earnings" to "Ads Value"
    value: "$2,450",
    change: "+$340 this month",
    icon: DollarSign,
    color: "text-emerald-600",
  },
]

// Mock recent listings
const recentListings = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: "$899",
    status: "active",
    views: 156,
    messages: 3,
    image: "/iphone-14-pro-max.png",
  },
  {
    id: "2",
    title: "Gaming Laptop - RTX 3070",
    price: "$1,200",
    status: "sold",
    views: 89,
    messages: 1,
    image: "/placeholder.svg",
  },
  {
    id: "3",
    title: "Vintage Leather Jacket",
    price: "$85",
    status: "active",
    views: 45,
    messages: 0,
    image: "/vintage-leather-jacket.png",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/sell">
                <Plus className="h-6 w-6" />
                <span>Post Free Ads</span> {/* Updated from "Sell New Item" to "Post Free Ads" */}
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-6 w-6" />
                <span>View Messages</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/listings">
                <Package className="h-6 w-6" />
                <span>Manage Ads</span> {/* Updated from analytics to manage ads */}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Listings</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/listings">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentListings.map((listing) => (
              <div key={listing.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{listing.title}</h4>
                  <p className="text-lg font-bold text-primary">{listing.price}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {listing.views} views
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {listing.messages} messages
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
