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
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Admin API error:', error)
      return NextResponse.json({ 
        exists: false, 
        error: 'Unable to verify email' 
      }, { status: 500 })
    }

    const emailExists = users?.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )

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
