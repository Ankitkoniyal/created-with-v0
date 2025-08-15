import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Your Supabase project credentials
const supabaseUrl = "https://gkaeeayfwrgekssmtuzn.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYWVlYXlmd3JnZWtzc210dXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODIwMTQsImV4cCI6MjA3MDc1ODAxNH0.NXf2FIeZuAyACwTgnd6CI0u_-EhoE_GI4mJaDwC7yOA"

// Check if Supabase environment variables are available
export const isSupabaseConfigured = true

// Create a singleton instance of the Supabase client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export createClient for compatibility
export const createClient = () => supabase
