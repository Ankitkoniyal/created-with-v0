import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = createClient()
  const { action, entityType, entityId, payload } = await req.json()

  await supabase.from("audit_logs").insert([
    {
      action,
      entity_type: entityType,
      entity_id: entityId,
      payload,
      created_at: new Date().toISOString(),
    },
  ])

  return NextResponse.json({ success: true })
}
