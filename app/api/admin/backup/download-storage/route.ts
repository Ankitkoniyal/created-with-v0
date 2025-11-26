import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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

// This endpoint downloads Storage files as a ZIP archive
// WARNING: This can be very large and may timeout for large storage buckets
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get("bucket") || "product-images"
    const limit = parseInt(searchParams.get("limit") || "1000", 10)

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile) {
      if (!isSuperAdmin(user.email, null)) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    } else {
      if (!isSuperAdmin(profile.email || user.email, profile.role)) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Service configuration missing" },
        { status: 500 }
      )
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // List files in bucket
    const { data: files, error: listError } = await adminClient.storage
      .from(bucketName)
      .list('', {
        limit: Math.min(limit, 5000), // Max 5000 files per request
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      return NextResponse.json(
        { error: `Failed to list files: ${listError.message}` },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files found in bucket", bucket: bucketName },
        { status: 404 }
      )
    }

    // Return file manifest with download URLs
    // Note: For large files, consider using Supabase CLI or direct S3 access
    const timestamp = new Date().toISOString().split("T")[0]
    const manifest = {
      bucket: bucketName,
      backup_date: new Date().toISOString(),
      total_files: files.length,
      files: files.map(file => {
        const { data: urlData } = adminClient.storage
          .from(bucketName)
          .getPublicUrl(file.name)
        
        return {
          name: file.name,
          id: file.id,
          created_at: file.created_at,
          updated_at: file.updated_at,
          size: file.metadata?.size || null,
          mimetype: file.metadata?.mimetype || null,
          public_url: urlData.publicUrl,
          download_url: `${supabaseUrl}/storage/v1/object/${bucketName}/${file.name}`,
        }
      }),
      note: "Use these URLs to download files. For bulk download, use Supabase CLI or S3 direct access.",
    }

    const fileName = `storage-manifest-${bucketName}-${timestamp}.json`
    
    return new NextResponse(JSON.stringify(manifest, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("Storage backup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create storage backup" },
      { status: 500 }
    )
  }
}

