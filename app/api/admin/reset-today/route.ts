import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) return null
  return user
}

// DELETE /api/admin/reset-today — Apaga todos os picks de hoje (para regenerar)
export async function DELETE() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('daily_picks')
    .delete()
    .eq('date', today)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    deleted: data.length,
    date: today,
    picks: data.map(p => ({ match: p.match, pick_type: p.pick_type })),
  })
}
