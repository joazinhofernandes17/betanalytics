import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { PickResult } from '@/types'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) return null
  return user
}

// PATCH /api/admin/update-result — Atualiza resultado de uma aposta
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { pickId, result }: { pickId: string; result: PickResult } = body

  if (!pickId || !['win', 'loss', 'void', 'pending'].includes(result)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('daily_picks')
    .update({ result })
    .eq('id', pickId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Recalcular stats de todos os utilizadores com esta aposta guardada
  const { data: userBets } = await supabase
    .from('user_bets')
    .select('user_id')
    .eq('pick_id', pickId)

  if (userBets && userBets.length > 0) {
    const userIds = Array.from(new Set(userBets.map(b => b.user_id)))
    for (const userId of userIds) {
      await supabase.rpc('update_tipster_stats', { p_user_id: userId })
    }
  }

  return NextResponse.json({ success: true, pick: data })
}
