import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/user-bets — Guardar uma aposta no histórico
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { pickId, stake } = await request.json()

  if (!pickId) {
    return NextResponse.json({ error: 'pickId obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_bets')
    .insert({ user_id: user.id, pick_id: pickId, stake: stake ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Aposta já guardada' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Atualizar stats do tipster
  const adminSupabase = createAdminClient()
  await adminSupabase.rpc('update_tipster_stats', { p_user_id: user.id })

  return NextResponse.json({ success: true, bet: data }, { status: 201 })
}

// GET /api/user-bets — Listar apostas guardadas do utilizador
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const result = searchParams.get('result') // filtro opcional
  const league = searchParams.get('league')

  let query = supabase
    .from('user_bets')
    .select(`
      *,
      daily_picks (*)
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (result) {
    query = query.eq('daily_picks.result', result)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bets: data ?? [] })
}
