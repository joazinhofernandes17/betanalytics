import { createBrowserClient } from '@supabase/ssr'

// Cliente Supabase para uso no browser (componentes cliente)
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL inválido ou em falta: "${supabaseUrl}"`)
  }
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY em falta')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
