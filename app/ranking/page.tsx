import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { TipsterTable } from '@/components/TipsterTable'
import { Trophy } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ranking de Tipsters',
  description: 'Vê o ranking dos melhores tipsters da plataforma BetAnalytics.',
}

export default async function RankingPage() {
  const supabase = createAdminClient()
  const authClient = createClient()

  // Obter utilizador atual (para destacar no ranking)
  const { data: { user } } = await authClient.auth.getUser()

  // Buscar ranking completo com perfis
  const { data: stats } = await supabase
    .from('tipster_stats')
    .select(`
      *,
      profiles (id, username, avatar_url)
    `)
    .order('win_rate', { ascending: false })
    .order('total_bets', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Ranking de Tipsters</h1>
          <p className="text-sm text-zinc-400">Os melhores apostadores da plataforma</p>
        </div>
      </div>

      {/* Legenda de níveis */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { level: 'Bronze', desc: '< 20 apostas', color: 'text-amber-700 bg-amber-100/10 border-amber-700/20' },
          { level: 'Prata', desc: '20-49 apostas', color: 'text-slate-400 bg-slate-100/10 border-slate-400/20' },
          { level: 'Ouro', desc: '50-99 apostas', color: 'text-yellow-500 bg-yellow-100/10 border-yellow-500/20' },
          { level: 'Platina', desc: '100+ apostas', color: 'text-cyan-400 bg-cyan-100/10 border-cyan-400/20' },
        ].map(({ level, desc, color }) => (
          <span key={level} className={`px-2 py-1 rounded-full border font-medium ${color}`}>
            {level} · {desc}
          </span>
        ))}
      </div>

      {stats && stats.length > 0 ? (
        <TipsterTable stats={stats as any} currentUserId={user?.id} />
      ) : (
        <div className="py-20 text-center">
          <Trophy className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-500">Ainda não há tipsters no ranking.</p>
          <p className="text-sm text-zinc-600 mt-1">Guarda as tuas apostas para aparecer aqui!</p>
        </div>
      )}
    </div>
  )
}
