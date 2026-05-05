import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/picks?date=YYYY-MM-DD — Retorna picks de uma data específica
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const supabase = createClient()

  // Verificar sessão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: picks, error } = await supabase
    .from('daily_picks')
    .select('*')
    .eq('date', date)
    .order('confidence_pct', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Verificar quais picks o utilizador já guardou
  const { data: savedBets } = await supabase
    .from('user_bets')
    .select('pick_id')
    .eq('user_id', user.id)
    .in('pick_id', (picks ?? []).map(p => p.id))

  const savedPickIds = (savedBets ?? []).map(b => b.pick_id)

  return NextResponse.json({
    picks: picks ?? [],
    savedPickIds,
    date,
  })
}
