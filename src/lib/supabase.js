import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERRECT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 建立 Supabase client（用於 Server Component，使用 service role key 繞過 RLS）
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// 建立 Supabase client（用於 Client Component，使用 anon key）
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default supabase
