import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 建立 Supabase client（用於 Server Component）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 建立 Supabase client（用於 Client Component）
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default supabase
