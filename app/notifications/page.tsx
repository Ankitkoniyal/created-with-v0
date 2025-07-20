"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageCircle, Heart, ShoppingCart, User, Check, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    type: "message",
    title: "New message from Jane Smith",
    description: "Interested in your iPhone 14 Pro Max",
    time: "2 minutes ago",
    read: false,
    icon: MessageCircle,
    color: "text-blue-500",
  },
  {
    id: "2",
    type: "wishlist",
    title: "Item added to wishlist",
    description: "Someone added your Honda City to their wishlist",
    time: "1 hour ago",
    read: false,
    icon: Heart,
    color: "text-red-500",
  },
  {
    id: "3",
    type: "sale",
    title: "Price drop alert",
    description: "MacBook Pro M2 price dropped by ₹5,000",
    time: "3 hours ago",
    read: true,
    icon: ShoppingCart,
    color: "text-green-500",
  },
  {
    id: "4",
    type: "profile",
    title: "Profile view",
    description: "Mike Johnson viewed your profile",
    time: "1 day ago",
    read: true,
    icon: User,
    color: "text-purple-500",
  },
  {
    id: "5",
    type: "message",
    title: "New message from Alex Kumar",
    description: "Asked about your Cricket Kit availability",
    time: "2 days ago",
    read: true,
    icon: MessageCircle,
    color: "text-blue-500",
  },
]

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const filteredNotifications = notifications.filter((notif) => (filter === "all" ? true : !notif.read))

  const unreadCount = notifications.filter((notif) => !notif.read).length

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Please sign in to view your notifications</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-500" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="flex items-center gap-2"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className="flex items-center gap-2"
          >
            Unread
            {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>}
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const IconComponent = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.read ? "border-blue-200 bg-blue-50/30" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full bg-gray-100 ${notification.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {notification.title}
                              {!notification.read && <Badge className="ml-2 bg-blue-500 text-white text-xs">New</Badge>}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                            <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  No notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {filter === "unread" ? "You have no unread notifications." : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
