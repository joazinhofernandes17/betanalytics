import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/server'
import type { AIPickResponse } from '@/types'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// POST /api/generate-picks — Gera as 3 apostas do dia com Groq (llama-3.3-70b-versatile)
// Protegido por chave secreta (CRON_SECRET ou header de admin)
export async function POST(request: NextRequest) {
  // Verificar autorização
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Verificar se já existem picks para hoje (evitar duplicados)
  const { data: existing } = await supabase
    .from('daily_picks')
    .select('id')
    .eq('date', today)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { message: 'Picks já gerados para hoje', date: today },
      { status: 200 }
    )
  }

  // Formatar data em português para o prompt
  const dateFormatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  try {
    // Chamada ao Groq para gerar as apostas
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `És um analista profissional de apostas desportivas de futebol com 20 anos de experiência.
Analisas estatísticas avançadas, forma recente, confrontos diretos, lesões, motivação das equipas e valor das odds.
O teu objetivo é identificar 3 apostas de alto valor com probabilidade de acerto superior a 75%.
Responde sempre em JSON válido, sem markdown, sem texto adicional.`,
        },
        {
          role: 'user',
          content: `Gera 3 apostas de futebol para hoje ${dateFormatted}.
Para cada aposta inclui:
- match (string): nome das equipas, ex: "Benfica vs Porto"
- league (string): nome da liga, ex: "Liga Portugal"
- pick_type (string): tipo de aposta, ex: "Vitória Casa", "Over 2.5 Golos", "Ambas Marcam"
- odds (number): odds entre 1.3 e 3.0
- confidence_pct (integer): confiança entre 75 e 95
- analysis (string): análise detalhada com 150-200 palavras explicando forma recente, estatísticas, fatores decisivos e por que esta aposta tem valor

Formato de resposta: array JSON de exatamente 3 objetos. Nenhum texto adicional.`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Resposta inesperada da IA')
    }

    // Limpar possível markdown no JSON
    const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const picks: AIPickResponse[] = JSON.parse(jsonText)

    if (!Array.isArray(picks) || picks.length !== 3) {
      throw new Error('Formato de picks inválido')
    }

    // Inserir picks no Supabase
    const picksToInsert = picks.map(pick => ({
      date: today,
      match: pick.match,
      league: pick.league,
      pick_type: pick.pick_type,
      odds: Number(pick.odds),
      confidence_pct: Number(pick.confidence_pct),
      analysis: pick.analysis,
      result: 'pending',
    }))

    const { data, error } = await supabase
      .from('daily_picks')
      .insert(picksToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, date: today, picks: data }, { status: 201 })
  } catch (err) {
    console.error('Erro ao gerar picks:', err)
    return NextResponse.json(
      { error: 'Falha ao gerar picks', details: String(err) },
      { status: 500 }
    )
  }
}
