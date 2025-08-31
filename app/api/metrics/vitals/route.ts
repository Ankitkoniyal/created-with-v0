import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const metric = await req.json()
    // Log with a stable tag for easy filtering in logs
    console.log("[v0] web-vitals", {
      name: metric?.name,
      id: metric?.id,
      value: metric?.value,
      rating: metric?.rating,
      navigationType: metric?.navigationType,
    })
  } catch (e: any) {
    console.log("[v0] web-vitals parse error", e?.message)
  }
  return NextResponse.json({ ok: true }, { status: 200 })
}
