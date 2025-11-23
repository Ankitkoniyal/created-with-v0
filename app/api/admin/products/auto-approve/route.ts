import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { insertNotifications } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, delayMinutes } = body

    if (!productId || delayMinutes === undefined) {
      return NextResponse.json({ error: "Missing productId or delayMinutes" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Service key missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Calculate approval time
    const approvalTime = new Date()
    approvalTime.setMinutes(approvalTime.getMinutes() + delayMinutes)

    // Store the scheduled approval time in a metadata field or separate table
    // For now, we'll use a simple approach: store it in product metadata or create a scheduled_approvals table
    // Since we don't have a scheduled_approvals table, we'll use a cron job approach
    
    // Update product with scheduled approval time (we can add a column for this later)
    // For now, we'll just store it and the cron job will check products created before (now - delay)
    
    // Get product details
    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("id, title, user_id, created_at, status")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.status !== "pending") {
      return NextResponse.json({ error: "Product is not pending approval" }, { status: 400 })
    }

    // Store scheduled approval info
    // We'll use a simple approach: store approval_time in a JSONB field or create a table
    // For simplicity, let's create a scheduled_approvals entry
    const { error: scheduleError } = await adminClient
      .from("scheduled_approvals")
      .upsert({
        product_id: productId,
        approval_time: approvalTime.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: "product_id",
      })
      .select()

    // If table doesn't exist, that's okay - we'll handle it gracefully
    if (scheduleError && scheduleError.code !== "42P01") {
      console.warn("Failed to create scheduled approval entry:", scheduleError)
      // Continue anyway - the cron job can work without this table
    }

    return NextResponse.json({ 
      success: true, 
      message: `Product will be auto-approved at ${approvalTime.toISOString()}`,
      approvalTime: approvalTime.toISOString(),
    })
  } catch (error) {
    console.error("Auto-approve scheduling error:", error)
    return NextResponse.json({ 
      error: "Failed to schedule auto-approval",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// This endpoint can be called by a cron job to process scheduled approvals
// Can also be called manually for testing
export async function GET(request: Request) {
  // Allow manual trigger with ?manual=true query param (for testing)
  const { searchParams } = new URL(request.url)
  const isManual = searchParams.get("manual") === "true"
  
  // Security: Verify cron secret for production cron calls
  // Skip check if manual=true (for local testing) or if CRON_SECRET is not set
  if (!isManual && process.env.CRON_SECRET) {
    const authHeader = request.headers.get("Authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      console.error("[Auto-Approve] Unauthorized cron request - missing or invalid CRON_SECRET")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Service key missing" }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    console.log(`[Auto-Approve] Processing scheduled approvals at ${now.toISOString()}`)

    // Try to get scheduled approvals from table
    let scheduledProducts: any[] = []
    
    try {
      const { data: scheduled, error: scheduledError } = await adminClient
        .from("scheduled_approvals")
        .select("product_id, approval_time")
        .lte("approval_time", now.toISOString())
        .eq("processed", false)

      if (scheduledError) {
        console.error("[Auto-Approve] Error querying scheduled_approvals:", scheduledError)
        // Continue to fallback
      } else if (scheduled && scheduled.length > 0) {
        console.log(`[Auto-Approve] Found ${scheduled.length} scheduled approvals ready to process`)
        scheduledProducts = scheduled
      } else {
        console.log("[Auto-Approve] No scheduled approvals found in table, checking fallback method")
      }
    } catch (tableError: any) {
      console.warn("[Auto-Approve] Table error (might not exist):", tableError.message)
      // Continue to fallback
    }

    // Fallback: If no scheduled approvals found, check products directly
    if (scheduledProducts.length === 0) {
      try {
        const { data: platformSettings, error: settingsError } = await adminClient
          .from("platform_settings")
          .select("auto_approve_ads, auto_approve_delay_minutes")
          .eq("id", "global")
          .single()

        if (settingsError) {
          console.error("[Auto-Approve] Error fetching platform settings:", settingsError)
          return NextResponse.json({ 
            error: "Failed to fetch platform settings",
            message: settingsError.message 
          }, { status: 500 })
        }

        if (platformSettings?.auto_approve_ads && platformSettings.auto_approve_delay_minutes) {
          const delayMinutes = platformSettings.auto_approve_delay_minutes
          const delayMs = delayMinutes * 60 * 1000
          // Calculate cutoff: products created before (now - delay) should be approved
          const cutoffTime = new Date(now.getTime() - delayMs)
          console.log(`[Auto-Approve] Fallback: Looking for pending products created before ${cutoffTime.toISOString()} (delay: ${delayMinutes} minutes)`)

          const { data: pendingProducts, error: productsError } = await adminClient
            .from("products")
            .select("id, title, user_id, created_at, status")
            .eq("status", "pending")
            .lte("created_at", cutoffTime.toISOString())

          if (productsError) {
            console.error("[Auto-Approve] Error fetching pending products:", productsError)
          } else if (pendingProducts && pendingProducts.length > 0) {
            console.log(`[Auto-Approve] Found ${pendingProducts.length} pending products ready for auto-approval`)
            scheduledProducts = pendingProducts.map(p => ({
              product_id: p.id,
              approval_time: new Date(new Date(p.created_at).getTime() + delayMs).toISOString(),
            }))
          } else {
            console.log("[Auto-Approve] No pending products found for auto-approval")
          }
        } else {
          console.log("[Auto-Approve] Auto-approve is disabled or no delay set")
          return NextResponse.json({
            success: true,
            message: "Auto-approve is disabled or no delay configured",
            approved: 0,
            failed: 0,
          })
        }
      } catch (fallbackError) {
        console.error("[Auto-Approve] Fallback error:", fallbackError)
        return NextResponse.json({ 
          error: "Failed to process fallback auto-approval",
          message: fallbackError instanceof Error ? fallbackError.message : "Unknown error"
        }, { status: 500 })
      }
    }

    const approved: string[] = []
    const failed: string[] = []

    if (scheduledProducts.length === 0) {
      console.log("[Auto-Approve] No products to approve")
      return NextResponse.json({
        success: true,
        approved: 0,
        failed: 0,
        approvedIds: [],
        failedIds: [],
      })
    }

    console.log(`[Auto-Approve] Processing ${scheduledProducts.length} products for approval`)

    for (const scheduled of scheduledProducts) {
      try {
        console.log(`[Auto-Approve] Approving product ${scheduled.product_id}`)
        
        // First verify the product is still pending
        const { data: productCheck, error: checkError } = await adminClient
          .from("products")
          .select("id, status")
          .eq("id", scheduled.product_id)
          .single()

        if (checkError || !productCheck) {
          console.error(`[Auto-Approve] Product ${scheduled.product_id} not found:`, checkError)
          failed.push(scheduled.product_id)
          continue
        }

        if (productCheck.status !== "pending") {
          console.log(`[Auto-Approve] Product ${scheduled.product_id} is already ${productCheck.status}, skipping`)
          // Mark as processed even though we didn't approve it
          try {
            await adminClient
              .from("scheduled_approvals")
              .update({ processed: true, processed_at: now.toISOString() })
              .eq("product_id", scheduled.product_id)
          } catch {}
          continue
        }

        // Update product status to active
        const { error: updateError } = await adminClient
          .from("products")
          .update({ 
            status: "active",
            updated_at: now.toISOString(),
          })
          .eq("id", scheduled.product_id)
          .eq("status", "pending")

        if (updateError) {
          console.error(`[Auto-Approve] Failed to approve product ${scheduled.product_id}:`, updateError)
          failed.push(scheduled.product_id)
          continue
        }

        console.log(`[Auto-Approve] Successfully approved product ${scheduled.product_id}`)

        // Get product and user details for notification
        const { data: product } = await adminClient
          .from("products")
          .select("id, title, user_id")
          .eq("id", scheduled.product_id)
          .single()

        if (product?.user_id) {
          // Get user email
          const { data: userProfile } = await adminClient
            .from("profiles")
            .select("email, email_notifications")
            .eq("id", product.user_id)
            .single()

          // Send notification
          await insertNotifications(adminClient, [
            {
              userId: product.user_id,
              title: "🎉 Your ad has been approved!",
              message: `Great news! Your ad "${product.title ?? "listing"}" has been automatically approved and is now live on the platform.`,
              type: "ad_status_change",
              link: `/product/${product.id}`,
              priority: "success",
              data: {
                productId: product.id,
                status: "active",
              },
            },
          ])

          // Send email if enabled
          if (userProfile?.email && userProfile?.email_notifications !== false) {
            try {
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
              await fetch(`${siteUrl}/api/notifications/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: userProfile.email,
                  type: "ad_approved",
                  data: {
                    productTitle: product.title,
                    productId: product.id,
                    productUrl: `${siteUrl}/product/${product.id}`,
                  },
                }),
              })
            } catch (emailError) {
              console.warn("Failed to send approval email:", emailError)
            }
          }
        }

        // Mark as processed if table exists
        try {
          await adminClient
            .from("scheduled_approvals")
            .update({ processed: true, processed_at: now.toISOString() })
            .eq("product_id", scheduled.product_id)
        } catch {
          // Table might not exist, that's okay
        }

        approved.push(scheduled.product_id)
      } catch (error) {
        console.error(`Error processing scheduled approval for ${scheduled.product_id}:`, error)
        failed.push(scheduled.product_id)
      }
    }

    return NextResponse.json({
      success: true,
      approved: approved.length,
      failed: failed.length,
      approvedIds: approved,
      failedIds: failed,
    })
  } catch (error) {
    console.error("Auto-approve cron error:", error)
    return NextResponse.json({ 
      error: "Failed to process scheduled approvals",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

