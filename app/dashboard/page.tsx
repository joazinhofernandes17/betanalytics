import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsGrid } from '@/components/StatsGrid'
import { ResultBadge } from '@/components/ResultBadge'
import { ConfidenceBar } from '@/components/ConfidenceBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateShort, formatOdds } from '@/lib/utils'
import { BarChart3, Target, TrendingUp, Trophy } from 'lucide-react'
import { DashboardChart } from './DashboardChart'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  // Buscar histórico de apostas com detalhes dos picks
  const { data: bets } = await supabase
    .from('user_bets')
    .select(`*, daily_picks(*)`)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  // Buscar stats do tipster
  const { data: stats } = await supabase
    .from('tipster_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const totalBets = stats?.total_bets ?? 0
  const winRate = stats?.win_rate ?? 0
  const profitLoss = stats?.profit_loss ?? 0
  const wins = stats?.wins ?? 0

  // Dados para o gráfico (últimas 30 apostas com resultado)
  const chartData = (bets ?? [])
    .filter(b => b.daily_picks?.result && b.daily_picks.result !== 'pending')
    .slice(0, 30)
    .reverse()
    .map((b, idx) => ({
      idx: idx + 1,
      result: b.daily_picks?.result,
      date: formatDateShort(b.saved_at),
    }))

  const gridStats = [
    {
      label: 'Apostas Guardadas',
      value: (bets ?? []).length,
      icon: Target,
      color: 'bg-zinc-800',
    },
    {
      label: 'Taxa de Acerto',
      value: `${Number(winRate).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-green-500/20',
      description: totalBets > 0 ? `${wins}/${totalBets} resolvidas` : 'Sem dados',
    },
    {
      label: 'Lucro / Perda',
      value: `${Number(profitLoss) >= 0 ? '+' : ''}${Number(profitLoss).toFixed(2)}€`,
      icon: BarChart3,
      color: Number(profitLoss) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
    },
    {
      label: 'Wins',
      value: wins,
      icon: Trophy,
      color: 'bg-amber-500/20',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">O meu Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Acompanha o teu desempenho como tipster</p>
      </div>

      {/* Métricas */}
      <StatsGrid stats={gridStats} />

      {/* Gráfico de evolução */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Tabela de histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Apostas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!bets || bets.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Target className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
              <p>Ainda não guardaste nenhuma aposta.</p>
              <p className="text-sm mt-1">
                Vai à página de <a href="/apostas" className="text-green-400 hover:underline">Apostas</a> e guarda as tuas preferidas!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase">Jogo</th>
                    <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase">Aposta</th>
                    <th className="px-4 py-3 text-center text-xs text-zinc-500 uppercase">Odds</th>
                    <th className="px-4 py-3 text-center text-xs text-zinc-500 uppercase">Confiança</th>
                    <th className="px-4 py-3 text-center text-xs text-zinc-500 uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {bets.map(bet => {
                    const pick = bet.daily_picks
                    if (!pick) return null
                    return (
                      <tr key={bet.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                          {formatDateShort(pick.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-zinc-100 font-medium">{pick.match}</p>
                          <Badge variant="secondary" className="text-xs mt-0.5">{pick.league}</Badge>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{pick.pick_type}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-400">
                          {formatOdds(pick.odds)}
                        </td>
                        <td className="px-4 py-3 w-32">
                          <ConfidenceBar pct={pick.confidence_pct} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ResultBadge result={pick.result} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
