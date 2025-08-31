"use client"

import { Card, CardContent } from "@/components/ui/card"

interface LoadingSkeletonProps {
  type?: "card" | "list" | "profile" | "conversation"
  count?: number
}

export function LoadingSkeleton({ type = "card", count = 1 }: LoadingSkeletonProps) {
  const renderCardSkeleton = () => (
    <Card className="overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </CardContent>
    </Card>
  )

  const renderListSkeleton = () => (
    <div className="flex space-x-4 p-4 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  )

  const renderProfileSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </CardContent>
    </Card>
  )

  const renderConversationSkeleton = () => (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className={`max-w-xs p-3 rounded-lg animate-pulse ${i % 2 === 0 ? "bg-gray-200" : "bg-blue-200"}`}>
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  const skeletonMap = {
    card: renderCardSkeleton,
    list: renderListSkeleton,
    profile: renderProfileSkeleton,
    conversation: renderConversationSkeleton,
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletonMap[type]()}</div>
      ))}
    </div>
  )
}
