import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { insertNotifications } from "@/lib/notifications"
import { logger } from "@/lib/logger"
import { z } from "zod"

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
    })
    
    const validation = schema.safeParse(body)
    if (!validation.success) {
      logger.warn("Product delete validation failed", { error: validation.error, userId: user.id })
      return NextResponse.json({ ok: false, error: "invalid_product_id" }, { status: 400 })
    }
    
    const { productId } = validation.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "service_key_missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the product belongs to the user and get product details
    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("id, title, user_id")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ ok: false, error: "product_not_found" }, { status: 404 })
    }

    // Notify users who favorited this ad before deleting
    try {
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
            title: "Ad you favorited has been deleted",
            message: `The ad "${product.title ?? "listing"}" you saved to your favorites has been deleted by the seller.`,
            type: "ad_removed",
            link: null,
            priority: "info",
            data: {
              productId,
            },
          }))

          await insertNotifications(adminClient, favoriteNotifications)
        }
      }
      } catch (error) {
      logger.warn("Failed to notify favorites on product delete", { productId, error, userId: user.id })
      // Don't fail the request if notification fails
    }

    // Delete the product
    const { error: deleteError } = await adminClient
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", user.id)

    if (deleteError) {
      logger.error("Failed to delete product", { productId, error: deleteError.message, userId: user.id })
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 400 })
    }

    logger.info("Product deleted", { productId, userId: user.id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Product delete handler crashed", { error, userId: user?.id })
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

