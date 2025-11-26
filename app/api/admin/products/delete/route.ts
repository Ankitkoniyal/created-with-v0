import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { insertNotifications } from "@/lib/notifications"

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
    const { adIds, reason }: { adIds?: string[]; reason?: string } = body

    if (!Array.isArray(adIds) || adIds.length === 0) {
      return NextResponse.json({ ok: false, error: "missing_ad_ids" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const actorEmail = actor.email ?? (actor.user_metadata?.email as string | undefined) ?? null
    const actorRole = (actor.user_metadata?.role as string | undefined) ?? null

    if (!isSuperAdmin(actorEmail, actorRole)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: products, error: fetchError } = await adminClient
      .from("products")
      .select("id, title, user_id, status")
      .in("id", adIds)

    if (fetchError) {
      console.error("Failed to load products before deletion", fetchError)
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 400 })
    }

    // Track deletions in deactivated_ads table before deleting
    if (products && products.length > 0) {
      try {
        const deactivationRecords = products.map((product) => ({
          product_id: product.id,
          deactivated_by: actor.id,
          reason: reason || "Deleted by admin",
          status_before: product.status || "active",
          status_after: "deleted",
          moderation_note: reason || "Deleted by admin",
        }))

        await adminClient
          .from("deactivated_ads")
          .upsert(deactivationRecords, {
            onConflict: "product_id",
          })
      } catch (trackError) {
        // Don't fail the whole request if tracking fails (table might not exist yet)
        console.warn("Failed to track deleted ads", trackError)
      }
    }

    const { error: deleteError } = await adminClient.from("products").delete().in("id", adIds)

    if (deleteError) {
      console.error("Failed to delete products", deleteError)
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 400 })
    }

    // Notify ad owners
    const ownerNotifications =
      products
        ?.filter((product) => product?.user_id)
        .map((product) => ({
          userId: product.user_id!,
          actorId: actor.id,
          title: "Ad removed",
          message: [
            `Your ad "${product.title ?? "listing"}" has been removed by a super admin.`,
            reason ? `Reason: ${reason}` : null,
          ]
            .filter(Boolean)
            .join(" "),
          type: "ad_removed",
          data: {
            productId: product.id,
            reason: reason ?? null,
          },
        })) ?? []

    // Notify users who favorited these ads
    const favoriteNotifications: Array<{
      userId: string
      actorId: string
      title: string
      message: string
      type: string
      data: Record<string, unknown>
    }> = []

    for (const product of products || []) {
      try {
        // Get all users who favorited this product
        const { data: favorites, error: favoritesError } = await adminClient
          .from("favorites")
          .select("user_id")
          .eq("product_id", product.id)

        if (!favoritesError && favorites && favorites.length > 0) {
          // Filter out the ad owner (they already get a notification)
          const favoriteUserIds = favorites
            .map((f) => f.user_id)
            .filter((userId) => userId !== product.user_id)

          for (const userId of favoriteUserIds) {
            favoriteNotifications.push({
              userId,
              actorId: actor.id,
              title: "Ad removed from your favorites",
              message: `The ad "${product.title ?? "listing"}" you saved to your favorites has been removed.`,
              type: "ad_removed",
              link: null,
              priority: "info",
              data: {
                productId: product.id,
                reason: reason ?? null,
              },
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch favorites for product ${product.id}`, error)
        // Continue with other products even if one fails
      }
    }

    // Send all notifications
    const allNotifications = [...ownerNotifications, ...favoriteNotifications]
    if (allNotifications.length > 0) {
      await insertNotifications(adminClient, allNotifications)
    }

    return NextResponse.json({ ok: true, deletedIds: adIds })
  } catch (error) {
    console.error("Admin product delete handler crashed", error)
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

