import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/stats — Estatísticas globais públicas da plataforma
export async function GET() {
  const supabase = createAdminClient()

  // Total de picks com resultado definido
  const { data: picks } = await supabase
    .from('daily_picks')
    .select('result, odds')
    .neq('result', 'pending')

  if (!picks) {
    return NextResponse.json({ totalPicks: 0, winRate: 0, avgOdds: 0, totalWins: 0 })
  }

  const total = picks.filter(p => p.result !== 'void').length
  const wins = picks.filter(p => p.result === 'win').length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const avgOdds = total > 0
    ? Math.round((picks.reduce((acc, p) => acc + Number(p.odds), 0) / picks.length) * 100) / 100
    : 0

  return NextResponse.json({
    totalPicks: total,
    totalWins: wins,
    winRate,
    avgOdds,
  })
}
