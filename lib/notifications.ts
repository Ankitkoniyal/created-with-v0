import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

export interface NotificationInsert {
  userId: string
  title: string
  message: string
  actorId?: string | null
  type?: string | null
  link?: string | null
  data?: Record<string, unknown> | null
  priority?: "info" | "warning" | "critical" | string | null
}

export interface NotificationResult {
  success: boolean
  skipped?: boolean
  error?: PostgrestError
}

const NOTIFICATIONS_TABLE = "notifications"

const isTableMissing = (error: PostgrestError) => {
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "42P01" ||
    message.includes("does not exist") ||
    (message.includes("relation") && message.includes(NOTIFICATIONS_TABLE))
  )
}

export const insertNotifications = async <T extends SupabaseClient>(
  client: T,
  notifications: NotificationInsert[],
): Promise<NotificationResult> => {
  if (!notifications.length) {
    return { success: true }
  }

  const payload = notifications.map((notification) => ({
    user_id: notification.userId,
    actor_id: notification.actorId ?? null,
    title: notification.title,
    message: notification.message,
    type: notification.type ?? "general",
    link: notification.link ?? null,
    read: false,
    data: notification.data ?? null,
    priority: notification.priority ?? "info",
  }))

  const { error } = await client.from(NOTIFICATIONS_TABLE).insert(payload)

  if (error) {
    if (isTableMissing(error)) {
      console.warn("[notifications] Table not found. Skipping notification insert.")
      return { success: false, skipped: true }
    }

    console.error("[notifications] Failed to insert notifications", error)
    return { success: false, error }
  }

  return { success: true }
}

export const markNotificationsRead = async <T extends SupabaseClient>(
  client: T,
  userId: string,
  ids?: string[],
): Promise<NotificationResult> => {
  let query = client.from(NOTIFICATIONS_TABLE).update({ read: true, read_at: new Date().toISOString() }).eq("user_id", userId)

  if (ids && ids.length > 0) {
    query = query.in("id", ids)
  } else {
    query = query.eq("read", false)
  }

  const { error } = await query

  if (error) {
    if (isTableMissing(error)) {
      console.warn("[notifications] Table not found while marking notifications read.")
      return { success: false, skipped: true }
    }

    console.error("[notifications] Failed to mark notifications read", error)
    return { success: false, error }
  }

  return { success: true }
}

