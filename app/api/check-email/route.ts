import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Use service role key for admin access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if email exists using admin API
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email.toLowerCase())
    
    if (getUserError && getUserError.message !== 'User not found') {
      console.error('Admin API error:', getUserError)
      return NextResponse.json({ 
        exists: false, 
        error: 'Unable to verify email' 
      }, { status: 500 })
    }

    const emailExists = !!userData?.user
    
    // If email exists, check account status
    if (emailExists && userData.user) {
      const accountStatus = userData.user.user_metadata?.account_status as string | undefined
      
      // Also check profiles table for status
      let profileStatus: string | null = null
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("status")
          .eq("id", userData.user.id)
          .single()
        profileStatus = profile?.status || null
      } catch (err) {
        // Ignore profile fetch errors
      }
      
      const status = accountStatus || profileStatus || "active"
      
      // Block signup if account is banned or suspended
      if (status === "banned") {
        return NextResponse.json({ 
          exists: true,
          blocked: true,
          status: "banned",
          message: 'This email is associated with a banned account. Please contact support for resolution.'
        })
      }
      
      if (status === "suspended") {
        return NextResponse.json({ 
          exists: true,
          blocked: true,
          status: "suspended",
          message: 'This email is associated with a suspended account. Please contact support for resolution.'
        })
      }
      
      // If status is "deleted", allow signup (soft-deleted accounts can be recreated)
      // If status is "active", email exists, so block signup
      if (status === "active") {
        return NextResponse.json({ 
          exists: true,
          message: 'Email already registered'
        })
      }
    }

    console.log(`📧 Email check for ${email}: ${emailExists ? 'EXISTS' : 'AVAILABLE'}`)
    
    return NextResponse.json({ 
      exists: emailExists,
      message: emailExists ? 'Email already registered' : 'Email available'
    })
    
  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json({ 
      exists: false, 
      error: 'Server error' 
    }, { status: 500 })
  }
}
