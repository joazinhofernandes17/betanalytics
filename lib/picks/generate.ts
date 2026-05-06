import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchTodayMatches, formatMatchesForPrompt } from '@/lib/odds/fetch-matches'
import type { AIPickResponse } from '@/types'

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

  // Tentar buscar jogos reais da The Odds API
  const realMatches = await fetchTodayMatches()
  const hasRealMatches = realMatches.length >= 3

  // Construir prompts consoante disponibilidade de dados reais
  const systemPrompt = hasRealMatches
    ? `És um analista profissional de apostas desportivas de futebol com 20 anos de experiência.
Vais receber uma lista de jogos reais de hoje com as odds dos bookmakers europeus.
Analisa cada jogo e seleciona as 3 apostas de maior valor considerando: odds dos bookmakers, equipas envolvidas, liga, e probabilidade implícita das odds.
O teu objetivo é identificar value bets — apostas onde a probabilidade real é superior à probabilidade implícita nas odds.
Responde apenas em JSON válido, sem markdown, sem texto adicional.`
    : `És um analista profissional de apostas desportivas de futebol com 20 anos de experiência.
Analisas estatísticas avançadas, forma recente, confrontos diretos, lesões, motivação das equipas e valor das odds.
O teu objetivo é identificar 3 apostas de alto valor com probabilidade de acerto superior a 75%.
Responde sempre em JSON válido, sem markdown, sem texto adicional.`

  const userPrompt = hasRealMatches
    ? `Aqui estão os jogos de futebol de hoje (${dateFormatted}) com odds reais dos bookmakers:

${formatMatchesForPrompt(realMatches)}

Seleciona as 3 melhores apostas com maior valor (value bets). Para cada aposta indica:
- match (string): "Equipa A vs Equipa B" (usa os nomes exatos da lista)
- league (string): nome da liga (usa o valor exato da lista)
- pick_type (string): tipo de aposta, ex: "Vitória Casa", "Vitória Fora", "Empate", "Over 2.5 Golos", "Ambas Marcam"
- odds (number): usa o valor real da API para o outcome escolhido
- confidence_pct (integer): confiança entre 75 e 95
- analysis (string): análise detalhada com 150-200 palavras sobre o jogo, valor das odds e por que é uma boa aposta

Formato: array JSON de exatamente 3 objetos. Nenhum texto adicional.`
    : `Gera 3 apostas de futebol para hoje ${dateFormatted}.
Para cada aposta inclui:
- match (string): nome das equipas, ex: "Benfica vs Porto"
- league (string): nome da liga, ex: "Liga Portugal"
- pick_type (string): tipo de aposta, ex: "Vitória Casa", "Over 2.5 Golos", "Ambas Marcam"
- odds (number): odds entre 1.3 e 3.0
- confidence_pct (integer): confiança entre 75 e 95
- analysis (string): análise detalhada com 150-200 palavras

Formato de resposta: array JSON de exatamente 3 objetos. Nenhum texto adicional.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
