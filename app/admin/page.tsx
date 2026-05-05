import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminPanel } from './AdminPanel'

export const metadata: Metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Buscar picks de hoje para o admin
  const { data: todayPicks } = await supabase
    .from('daily_picks')
    .select('*')
    .eq('date', today)
    .order('confidence_pct', { ascending: false })

  // Estatísticas gerais
  const { count: totalPicks } = await supabase
    .from('daily_picks')
    .select('*', { count: 'exact', head: true })

  const { count: totalBets } = await supabase
    .from('user_bets')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <AdminPanel
      todayPicks={todayPicks ?? []}
      stats={{
        totalPicks: totalPicks ?? 0,
        totalBets: totalBets ?? 0,
        totalUsers: totalUsers ?? 0,
      }}
    />
  )
}
