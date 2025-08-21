"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Eye, Plus, MessageSquare, TrendingUp, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Active Ads",
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
    title: "Ad Performance",
    value: "85%",
    change: "Response rate",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
]

const recentListings = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: "$899",
    status: "active",
    views: 156,
    messages: 3,
    image: "/iphone-14-pro-max.png",
    category: "Electronics",
    postedDate: "2 days ago",
  },
  {
    id: "2",
    title: "Gaming Laptop - RTX 3070",
    price: "$1,200",
    status: "sold",
    views: 89,
    messages: 1,
    image: "/placeholder.svg",
    category: "Electronics",
    postedDate: "1 week ago",
  },
  {
    id: "3",
    title: "Vintage Leather Jacket",
    price: "$85",
    status: "active",
    views: 45,
    messages: 0,
    image: "/vintage-leather-jacket.png",
    category: "Fashion",
    postedDate: "3 days ago",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p className="text-muted-foreground mb-4">Manage your ads, track performance, and connect with buyers.</p>
        <Button asChild>
          <Link href="/sell">
            <Plus className="h-4 w-4 mr-2" />
            Post New Ad
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/sell">
                <Plus className="h-6 w-6" />
                <span>Post Free Ad</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-6 w-6" />
                <span>Messages</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/listings">
                <Package className="h-6 w-6" />
                <span>Manage Ads</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/analytics">
                <TrendingUp className="h-6 w-6" />
                <span>Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Recent Ads</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/listings">View All Ads</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-foreground">{listing.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {listing.category}
                    </Badge>
                  </div>
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
                    <span>{listing.postedDate}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ad Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Add more photos</p>
                  <p className="text-sm text-muted-foreground">Ads with 3+ photos get 40% more views</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Update descriptions</p>
                  <p className="text-sm text-muted-foreground">Detailed descriptions increase buyer interest</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Respond quickly</p>
                  <p className="text-sm text-muted-foreground">Fast responses lead to more sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">New view on iPhone 14</p>
                  <p className="text-sm text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">New message received</p>
                  <p className="text-sm text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Ad promoted successfully</p>
                  <p className="text-sm text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
