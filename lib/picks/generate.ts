import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/server'
import type { AIPickResponse } from '@/types'

// Lógica partilhada de geração de picks — usada pela rota de cron e pelo painel admin
export async function generateDailyPicks(): Promise<
  | { success: true; picks: any[]; date: string }
  | { alreadyExists: true; date: string }
  | { error: string; details?: string }
> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Verificar se já existem picks para hoje
  const { data: existing } = await supabase
    .from('daily_picks')
    .select('id')
    .eq('date', today)
    .limit(1)

  if (existing && existing.length > 0) {
    return { alreadyExists: true, date: today }
  }

  const dateFormatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  try {
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
    if (!content) throw new Error('Resposta vazia da IA')

    const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const picks: AIPickResponse[] = JSON.parse(jsonText)

    if (!Array.isArray(picks) || picks.length !== 3) {
      throw new Error('A IA não devolveu exatamente 3 picks')
    }

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

    return { success: true, picks: data ?? [], date: today }
  } catch (err) {
    console.error('Erro ao gerar picks:', err)
    return { error: 'Falha ao gerar picks', details: String(err) }
  }
}
