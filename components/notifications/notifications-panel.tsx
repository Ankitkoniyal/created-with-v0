"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { markNotificationsRead } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationRecord = {
  id: string
  title: string
  message: string
  type: string | null
  link: string | null
  read: boolean
  priority: string | null
  created_at: string
  data?: Record<string, unknown> | null
}

type LoadState = "idle" | "loading" | "error"

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
  success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  info: "bg-slate-100 text-slate-800 border border-slate-200",
}

const TYPE_LABELS: Record<string, string> = {
  new_ad: "New Ad",
  ad_status_change: "Ad Update",
  ad_removed: "Ad Removed",
  message: "Message",
  system: "System",
}

const getBadgeClass = (priority: string | null | undefined) => {
  if (!priority) return PRIORITY_STYLES.info
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.info
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleString()
}

export function NotificationsPanel() {
  const { user, isLoading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setLoadState("loading")
    setErrorMessage(null)

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, link, read, priority, created_at, data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        const message = (error.message ?? "").toLowerCase()
        const tableMissing = error.code === "42P01" || message.includes("does not exist") || message.includes("relation")

        if (tableMissing) {
          setNotifications([])
          setErrorMessage("Notifications are not enabled yet. Ask the platform owner to set up the notifications table.")
          setLoadState("idle")
          return
        }

        setErrorMessage(error.message ?? "Failed to load notifications")
        setLoadState("error")
        return
      }

      setNotifications(data ?? [])
      setLoadState("idle")
    } catch (error) {
      console.error("Failed to load notifications", error)
      setErrorMessage("Failed to load notifications")
      setLoadState("error")
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (user?.id) {
      void loadNotifications()
    } else if (!authLoading) {
      setNotifications([])
    }
  }, [authLoading, loadNotifications, user?.id])

  const handleMarkAll = useCallback(async () => {
    if (!user?.id || notifications.length === 0) return
    setMarking(true)
    try {
      await markNotificationsRead(supabase, user.id)
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (error) {
      console.error("Failed to mark notifications read", error)
    } finally {
      setMarking(false)
    }
  }, [notifications.length, supabase, user?.id])

  const handleMarkSingle = useCallback(
    async (id: string) => {
      if (!user?.id) return
      setMarking(true)
      try {
        await markNotificationsRead(supabase, user.id, [id])
        setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
      } catch (error) {
        console.error("Failed to mark notification read", error)
      } finally {
        setMarking(false)
      }
    },
    [supabase, user?.id],
  )

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading your notifications...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sign in to view your notifications.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadNotifications()} disabled={loadState === "loading"}>
            {loadState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="default" size="sm" onClick={handleMarkAll} disabled={marking || unreadCount === 0}>
            {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark all as read"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Card className="border-amber-300 bg-amber-50 text-amber-900">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold">Heads up</h2>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p>No notifications yet.</p>
            <p className="text-sm">
              When important updates happen—like ad approvals, rejections, or messages—you&apos;ll see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const badgeClass = getBadgeClass(notification.priority)
            const typeLabel = notification.type ? TYPE_LABELS[notification.type] ?? "Update" : "Update"
            return (
              <Card key={notification.id} className={cn("border border-border", !notification.read && "border-primary/50")}>
                <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {notification.type === "ad_removed" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : notification.type === "ad_status_change" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">{notification.title}</h2>
                        <Badge className={badgeClass}>{typeLabel}</Badge>
                        {!notification.read && <Badge variant="secondary">Unread</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Received {formatDate(notification.created_at)}</p>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View details
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkSingle(notification.id)} disabled={marking}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}

