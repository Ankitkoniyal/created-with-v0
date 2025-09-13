import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }

  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

export async function GET(req: Request) {
  console.log("[v0] === My-listings API called ===");

  try {
    return await withTimeout(handleMyListingsRequest(req), 8000);
  } catch (error: any) {
    console.error("[v0] === CRITICAL ERROR in my-listings API ===");
    console.error("[v0] Error:", error?.message || "Unknown error");

    return NextResponse.json(
      {
        listings: [],
        error: "Service temporarily unavailable. Please try again.",
      },
      { status: 500 }
    );
  }
}

async function handleMyListingsRequest(req: Request) {
  let supabase;
  try {
    supabase = await withTimeout(createSupabaseServerClient(), 3000);
    if (!supabase) {
      throw new Error("Supabase client creation failed");
    }
  } catch (clientError) {
    console.error("[v0] Supabase client error:", clientError);
    return NextResponse.json(
      { listings: [], error: "Database connection failed" },
      { status: 503 }
    );
  }

  let user;
  try {
    const {
      data: { user: authUser },
      error: userErr,
    } = await withTimeout(supabase.auth.getUser(), 2000);

    if (userErr || !authUser) {
      return NextResponse.json(
        { listings: [], error: "Authentication required" },
        { status: 401 }
      );
    }
    user = authUser;
  } catch (authError) {
    console.error("[v0] Auth timeout:", authError);
    return NextResponse.json(
      { listings: [], error: "Authentication timeout" },
      { status: 408 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") || "20", 10) || 20,
      50
    );

    const { data, error } = await withTimeout(
      supabase
        .from("products")
        .select(
          "id,title,description,price,status,category,created_at,primary_image,condition,location"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) // ✅ fixed typo
        .limit(limit),
      4000
    );

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const listings = (data || []).map((r: any) => ({
      ...r,
      images: r.primary_image ? [r.primary_image] : [],
      adId: `AD${new Date(r.created_at).getFullYear()}${r.id
        .slice(-4)
        .toUpperCase()}`,
      description: r.description || "No description available",
      location: r.location || "Location not specified",
      condition: r.condition || "Used",
    }));

    return NextResponse.json({ listings }, { status: 200 });
  } catch (dbError) {
    console.error("[v0] Database error:", dbError);
    return NextResponse.json(
      { listings: [], error: "Failed to load listings" },
      { status: 500 }
    );
  }
}
