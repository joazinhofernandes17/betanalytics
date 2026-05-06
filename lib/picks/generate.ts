import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchTodayMatches, formatMatchesForPrompt } from '@/lib/odds/fetch-matches'
import type { AIPickResponse } from '@/types'

export async function generateDailyPicks(): Promise<
  | { success: true; picks: any[]; date: string }
  | { alreadyExists: true; date: string }
  | { noGames: true; date: string }
  | { error: string; details?: string }
> {
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

  // Buscar jogos reais da The Odds API
  const realMatches = await fetchTodayMatches()

  if (realMatches.length === 0) {
    console.log(`Nenhum jogo encontrado hoje (${today}) nas ligas configuradas — sem picks gerados.`)
    return { noGames: true, date: today }
  }

  // Gerar entre 1 e 3 picks conforme jogos disponíveis
  const picksCount = Math.min(realMatches.length, 3)
  const matchesToAnalyze = realMatches.slice(0, Math.max(realMatches.length, picksCount))

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const dateFormatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const systemPrompt = `És um analista profissional de apostas desportivas de futebol com 20 anos de experiência.
Vais receber uma lista de jogos reais de hoje com as odds dos bookmakers europeus.
Analisa cada jogo e seleciona as ${picksCount} apostas de maior valor considerando: odds dos bookmakers, equipas envolvidas, liga, e probabilidade implícita das odds.
O teu objetivo é identificar value bets — apostas onde a probabilidade real é superior à probabilidade implícita nas odds.
Usa APENAS os jogos da lista fornecida. Nunca inventes jogos ou equipas.
Responde apenas em JSON válido, sem markdown, sem texto adicional.`

  const userPrompt = `Aqui estão os jogos de futebol de hoje (${dateFormatted}) com odds reais dos bookmakers:

${formatMatchesForPrompt(matchesToAnalyze)}

Seleciona as ${picksCount} melhores apostas com maior valor (value bets). Para cada aposta indica:
- match (string): "Equipa A vs Equipa B" (usa os nomes exatos da lista acima)
- league (string): nome da liga (usa o valor exato da lista)
- pick_type (string): tipo de aposta, ex: "Vitória Casa", "Vitória Fora", "Empate", "Over 2.5 Golos", "Ambas Marcam"
- odds (number): usa o valor real da API para o outcome escolhido
- confidence_pct (integer): confiança entre 70 e 95
- analysis (string): análise detalhada com 150-200 palavras sobre o jogo, valor das odds e por que é uma boa aposta

Formato: array JSON de exatamente ${picksCount} objeto(s). Nenhum texto adicional.`

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

    if (!Array.isArray(picks) || picks.length !== picksCount) {
      throw new Error(`A IA devolveu ${Array.isArray(picks) ? picks.length : 'resposta inválida'} picks em vez de ${picksCount}`)
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
