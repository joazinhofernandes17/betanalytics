import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyPicks } from '@/lib/picks/generate'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) return null
  return user
}

// POST /api/admin/generate-picks — Chama generateDailyPicks diretamente (sem fetch HTTP)
export async function POST() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const result = await generateDailyPicks()

  if ('alreadyExists' in result) {
    return NextResponse.json({ message: 'Picks já gerados para hoje', date: result.date })
  }
  if ('error' in result) {
    return NextResponse.json({ error: result.error, details: result.details }, { status: 500 })
  }
  return NextResponse.json({ success: true, date: result.date, picks: result.picks }, { status: 201 })
}
