import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { insertNotifications } from "@/lib/notifications"
import { logger } from "@/lib/logger"
import { z } from "zod"

type ProductStatus = "active" | "sold" | "expired" | "pending" | "rejected" | "deleted" | "inactive"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    
    // Validate request body
    const schema = z.object({
      productId: z.string().uuid("Invalid product ID"),
      status: z.enum(["sold", "active"], {
        errorMap: () => ({ message: "Status must be 'sold' or 'active'" }),
      }),
    })
    
    const validation = schema.safeParse(body)
    if (!validation.success) {
      logger.warn("Product status update validation failed", { error: validation.error, userId: user.id })
      return NextResponse.json({ ok: false, error: validation.error.errors[0]?.message || "invalid_parameters" }, { status: 400 })
    }
    
    const { productId, status } = validation.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the product belongs to the user
    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("id, title, user_id, status")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ ok: false, error: "product_not_found" }, { status: 404 })
    }

    // Update the product status
    const { error: updateError } = await adminClient
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", productId)

    if (updateError) {
      logger.error("Failed to update product status", { productId, status, error: updateError.message, userId: user.id })
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 })
    }

    // Notify users who favorited this ad (only for sold status)
    if (status === "sold") {
      try {
        // Get all users who favorited this product
        const { data: favorites, error: favoritesError } = await adminClient
          .from("favorites")
          .select("user_id")
          .eq("product_id", productId)

        if (!favoritesError && favorites && favorites.length > 0) {
          // Filter out the ad owner (they don't need a notification for their own action)
          const favoriteUserIds = favorites
            .map((f) => f.user_id)
            .filter((userId) => userId !== user.id)

          if (favoriteUserIds.length > 0) {
            const favoriteNotifications = favoriteUserIds.map((userId) => ({
              userId,
              actorId: user.id,
              title: "Ad you favorited has been sold",
              message: `The ad "${product.title ?? "listing"}" you saved to your favorites has been marked as sold.`,
              type: "ad_status_change",
              link: `/product/${productId}`,
              priority: "info",
              data: {
                productId,
                status: "sold",
              },
            }))

            await insertNotifications(adminClient, favoriteNotifications)
          }
        }
      } catch (error) {
        logger.warn("Failed to notify favorites on status change", { productId, status, error, userId: user.id })
        // Don't fail the request if notification fails
      }
    }

    logger.info("Product status updated", { productId, status, userId: user.id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Product status update handler crashed", { error, userId: user?.id })
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

