import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/daily-picks — Cron job da Vercel (08:00 Lisboa = 07:00 UTC)
// Configurado em vercel.json: "0 7 * * *"
export async function GET(request: NextRequest) {
  // Verificar que é a Vercel a chamar (header de autorização do cron)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Delegar para a rota principal de geração de picks
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${appUrl}/api/generate-picks`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
