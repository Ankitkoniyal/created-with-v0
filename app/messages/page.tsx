"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

// Mock conversation data
const mockConversations = [
  {
    id: "1",
    adId: "AD12345678",
    adTitle: "iPhone 14 Pro Max - Excellent Condition",
    otherUser: {
      id: "2",
      name: "Jane Smith",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    },
    lastMessage: "Is this still available?",
    lastMessageTime: "2 hours ago",
    unreadCount: 2,
  },
  {
    id: "2",
    adId: "AD23456789",
    adTitle: "Honda City 2020 - Well Maintained",
    otherUser: {
      id: "3",
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    lastMessage: "Can we meet tomorrow?",
    lastMessageTime: "1 day ago",
    unreadCount: 0,
  },
]

const mockMessages = [
  {
    id: "1",
    senderId: "2",
    content: "Hi, is this iPhone still available?",
    timestamp: "10:30 AM",
    isOwn: false,
  },
  {
    id: "2",
    senderId: "1",
    content: "Yes, it's still available. Would you like to see it?",
    timestamp: "10:35 AM",
    isOwn: true,
  },
  {
    id: "3",
    senderId: "2",
    content: "Great! Can we meet this evening?",
    timestamp: "10:40 AM",
    isOwn: false,
  },
]

export default function MessagesPage() {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // Here you would typically send the message to your backend
    console.log("Sending message:", newMessage)
    setNewMessage("")
  }

  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.adTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Please sign in to view your messages</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-blue-500" />
            Messages
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation.id === conversation.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={conversation.otherUser.avatar || "/placeholder.svg"}
                          alt={conversation.otherUser.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">{conversation.otherUser.name}</p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-500 text-white text-xs">{conversation.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conversation.adTitle}</p>
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                          <p className="text-xs text-gray-400">{conversation.lastMessageTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <Image
                    src={selectedConversation.otherUser.avatar || "/placeholder.svg"}
                    alt={selectedConversation.otherUser.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.otherUser.name}</CardTitle>
                    <p className="text-sm text-gray-500">{selectedConversation.adTitle}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isOwn ? "text-blue-100" : "text-gray-500"}`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
