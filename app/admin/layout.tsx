import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

// Emails de admin (configurar em variável de ambiente para produção)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  // Verificar se é admin
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/')
  }

  let profile: Profile | null = null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  profile = data

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={profile} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
