import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient, type PostgrestError } from "@supabase/supabase-js"
import { insertNotifications } from "@/lib/notifications"

type ProductStatus = "active" | "sold" | "expired" | "pending" | "rejected" | "deleted" | "inactive"

const DEFAULT_SUPER_ADMIN_EMAILS = ["ankit.koniyal000@gmail.com"]

const getAllowlistedEmails = () => {
  const env = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? ""
  const derived = env
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const merged = new Set([...DEFAULT_SUPER_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...derived])
  return Array.from(merged)
}

const ALLOWLIST = getAllowlistedEmails()

const isSuperAdmin = (email: string | null | undefined, role: string | null | undefined) => {
  if (role === "super_admin" || role === "owner") return true
  if (!email) return false
  return ALLOWLIST.includes(email.toLowerCase())
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user: actor },
    } = await supabase.auth.getUser()

    if (!actor) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { adId, status, note }: { adId?: string; status?: ProductStatus; note?: string } = body

    if (!adId || !status) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 })
    }

    const actorEmail = actor.email ?? (actor.user_metadata?.email as string | undefined) ?? null
    const actorRole = (actor.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(actorEmail, actorRole)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const moderatedAt = new Date().toISOString()
    const initialPayload: Record<string, unknown> = {
      status,
      updated_at: moderatedAt,
    }

    if (note !== undefined) {
      initialPayload.moderation_note = note ?? null
    }

    const optionalFields: Array<{ key: string; selectColumn: string }> = [
      { key: "moderation_note", selectColumn: "moderation_note" },
      { key: "moderated_by", selectColumn: "moderated_by" },
      { key: "moderated_at", selectColumn: "moderated_at" },
    ]

    const optionalAssignments: Record<string, unknown> = {
      moderation_note: note ?? null,
      moderated_by: actor.id,
      moderated_at: moderatedAt,
    }

    const selectColumns = ["id", "status", "moderation_note", "moderated_by", "moderated_at"]

    const performUpdate = async (payload: Record<string, unknown>, selectCols: string[]) =>
      adminClient
        .from("products")
        .update(payload)
        .eq("id", adId)
        .select(selectCols.join(", "))
        .single()

    let payload = { ...initialPayload, ...optionalAssignments }
    let columns = [...selectColumns]
    let missingHandled = new Set<string>()

    const detectMissingColumn = (error: PostgrestError): string | null => {
      const message = (error.message ?? "").toLowerCase()
      const details = (error.details ?? "").toLowerCase()
      for (const field of optionalFields) {
        if (missingHandled.has(field.key)) continue
        if (
          message.includes(field.key.toLowerCase()) ||
          details.includes(field.key.toLowerCase()) ||
          (message.includes("column") && message.includes(field.key.replace("_", " ")))
        ) {
          return field.key
        }
      }
      return null
    }

    const shouldRetry = (error: PostgrestError) => {
      if (error.code === "42703") return true
      return detectMissingColumn(error) !== null
    }

    let attempt = 0
    const maxAttempts = optionalFields.length + 1
    let lastError: PostgrestError | null = null
    let previousStatus: string | null = null

    // Get previous status before update
    try {
      const { data: currentProduct } = await adminClient
        .from("products")
        .select("status")
        .eq("id", adId)
        .single()
      previousStatus = currentProduct?.status ?? null
    } catch (err) {
      console.warn("Failed to fetch previous status", err)
    }

    while (attempt < maxAttempts) {
      const { data, error } = await performUpdate(payload, columns)
      if (!error) {
        // Track deactivation in deactivated_ads table if status changed to deactivated state
        if (status && ["inactive", "deleted", "rejected", "deactivated"].includes(status)) {
          try {
            await adminClient
              .from("deactivated_ads")
              .upsert({
                product_id: adId,
                deactivated_by: actor.id,
                reason: note || null,
                status_before: previousStatus,
                status_after: status,
                moderation_note: note || null,
              }, {
                onConflict: "product_id",
              })
          } catch (trackError) {
            // Don't fail the whole request if tracking fails (table might not exist yet)
            console.warn("Failed to track deactivated ad", trackError)
          }
        }

        // Fetch product owner for notifications
        try {
          const { data: productRow, error: productError } = await adminClient
            .from("products")
            .select("id, title, user_id")
            .eq("id", adId)
            .single()

          if (productError) {
            if ((productError as PostgrestError).code && (productError as PostgrestError).code !== "PGRST116") {
              console.warn("Failed to fetch product for notification", productError)
            }
          } else if (productRow?.user_id) {
            // Get user email from profiles table
            const { data: userProfile } = await adminClient
              .from("profiles")
              .select("email, email_notifications")
              .eq("id", productRow.user_id)
              .single()

            const statusLabel = status === "active" ? "approved and live" : status.replace(/_/g, " ")
            const titleText = status === "active" 
              ? "🎉 Your ad has been approved!" 
              : status === "rejected"
              ? "Ad status updated"
              : "Ad status updated"
            
            const messageParts = [
              status === "active" 
                ? `Great news! Your ad "${productRow.title ?? "listing"}" has been approved and is now live on the platform.`
                : `Your ad "${productRow.title ?? "listing"}" is now ${statusLabel}.`
            ]
            if (note) {
              messageParts.push(`Moderator note: ${note}`)
            }

            // Create notification for ad owner
            const ownerNotifications = [
              {
                userId: productRow.user_id,
                actorId: actor.id,
                title: titleText,
                message: messageParts.join(" "),
                type: "ad_status_change",
                link: `/product/${adId}`,
                priority: status === "active" ? "success" : status === "rejected" ? "warning" : "info",
                data: {
                  productId: adId,
                  status,
                  note,
                },
              },
            ]

            // Notify users who favorited this ad (only for sold/deleted status changes)
            const favoriteNotifications: Array<{
              userId: string
              actorId: string
              title: string
              message: string
              type: string
              link: string | null
              priority: string
              data: Record<string, unknown>
            }> = []

            if (status === "sold" || status === "deleted" || status === "inactive") {
              try {
                // Get all users who favorited this product
                const { data: favorites, error: favoritesError } = await adminClient
                  .from("favorites")
                  .select("user_id")
                  .eq("product_id", adId)

                if (!favoritesError && favorites && favorites.length > 0) {
                  // Filter out the ad owner (they already get a notification)
                  const favoriteUserIds = favorites
                    .map((f) => f.user_id)
                    .filter((userId) => userId !== productRow.user_id)

                  const statusMessage = status === "sold" 
                    ? "has been sold" 
                    : status === "deleted"
                    ? "has been deleted"
                    : "is no longer available"

                  for (const userId of favoriteUserIds) {
                    favoriteNotifications.push({
                      userId,
                      actorId: actor.id,
                      title: status === "sold" ? "Ad you favorited has been sold" : "Ad you favorited is no longer available",
                      message: `The ad "${productRow.title ?? "listing"}" you saved to your favorites ${statusMessage}.`,
                      type: "ad_status_change",
                      link: status === "deleted" ? null : `/product/${adId}`,
                      priority: status === "sold" ? "info" : "warning",
                      data: {
                        productId: adId,
                        status,
                      },
                    })
                  }
                }
              } catch (error) {
                console.warn(`Failed to fetch favorites for product ${adId}`, error)
                // Continue even if favorites fetch fails
              }
            }

            // Send all notifications
            const allNotifications = [...ownerNotifications, ...favoriteNotifications]
            if (allNotifications.length > 0) {
              await insertNotifications(adminClient, allNotifications)
            }

            // Send email notification if user has email notifications enabled
            if (userProfile?.email && userProfile?.email_notifications !== false) {
              try {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || 'http://localhost:3000'
                await fetch(`${siteUrl}/api/notifications/email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: userProfile.email,
                    type: status === "active" ? "ad_approved" : "ad_status_change",
                    subject: status === "active" 
                      ? "🎉 Your ad has been approved!"
                      : `Your ad status has been updated`,
                    data: {
                      productTitle: productRow.title,
                      productId: adId,
                      status,
                      note,
                      productUrl: `${siteUrl}/product/${adId}`,
                    },
                  }),
                })
              } catch (emailError) {
                console.warn("Failed to send email notification", emailError)
                // Don't fail the request if email fails
              }
            }
          }
        } catch (notificationError) {
          console.warn("Status update succeeded but notification failed", notificationError)
        }

        return NextResponse.json({ ok: true, product: data })
      }

      lastError = error
      if (!shouldRetry(error)) {
        break
      }

      const missingKey = detectMissingColumn(error)
      if (!missingKey) {
        break
      }

      console.warn(`Products table missing column "${missingKey}". Retrying without it.`)
      delete payload[missingKey]
      const fieldConfig = optionalFields.find((field) => field.key === missingKey)
      if (fieldConfig) {
        columns = columns.filter((column) => column !== fieldConfig.selectColumn)
        missingHandled.add(missingKey)
      }
      attempt += 1
    }

    console.error("Admin product status update failed", lastError ?? new Error("Unknown error"))
    const message =
      (lastError?.message ?? "Status update failed") +
      (lastError?.code ? ` (code: ${lastError.code})` : "")
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  } catch (error) {
    console.error("Admin product status handler crashed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}
