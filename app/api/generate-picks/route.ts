import { NextRequest, NextResponse } from 'next/server'
import { generateDailyPicks } from '@/lib/picks/generate'

// POST /api/generate-picks — Protegido por CRON_SECRET (cron Vercel e testes manuais)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
