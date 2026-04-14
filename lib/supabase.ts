import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://graowhqleggnahxacgtg.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYW93aHFsZWdnbmFoeGFjZ3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzY3NDYsImV4cCI6MjA5MDc1Mjc0Nn0.T3S6Y24Cnk5TMJv9Xd3q8lG0jXgv0GHeIqe86aBovDQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
