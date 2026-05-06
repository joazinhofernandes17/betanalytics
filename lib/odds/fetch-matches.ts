// Integração com The Odds API (https://the-odds-api.com)
// Plano gratuito: 500 requests/mês

export interface MatchOdds {
  homeTeam: string
  awayTeam: string
  league: string
  commenceTime: string
  odds: {
    home: number
    draw: number | null
    away: number
  }
}

interface OddsAPIBookmaker {
  key: string
  title: string
  markets: {
    key: string
    outcomes: { name: string; price: number }[]
  }[]
}

interface OddsAPIEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsAPIBookmaker[]
}

// Retorna o início e fim do dia de hoje no fuso horário de Lisboa em UTC
function getTodayRangeUTC(): { from: string; to: string; lisboaDate: string } {
  // Data de hoje em Lisboa (YYYY-MM-DD)
  const lisboaDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Lisbon',
  })

  // Início do dia Lisboa em UTC (meia-noite Lisboa → UTC)
  const from = new Date(`${lisboaDate}T00:00:00`)
  // Corrigir para UTC subtraindo o offset de Lisboa (UTC+1 inverno, UTC+2 verão)
  const offset = from.getTimezoneOffset() // minutos de diferença UTC−local
  const fromUTC = new Date(from.getTime() - offset * 60000)

  // Fim do dia Lisboa em UTC (23:59:59 Lisboa → UTC)
  const to = new Date(`${lisboaDate}T23:59:59`)
  const toUTC = new Date(to.getTime() - offset * 60000)

  return {
    from: fromUTC.toISOString(),
    to: toUTC.toISOString(),
    lisboaDate,
  }
}

// Verifica se um commence_time (UTC ISO string) cai no dia de hoje em Lisboa
function isMatchToday(commenceTime: string, lisboaDate: string): boolean {
  const matchDateLisboa = new Date(commenceTime).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Lisbon',
  })
  return matchDateLisboa === lisboaDate
}

// Extrai as odds médias de h2h entre todos os bookmakers disponíveis
function extractOdds(event: OddsAPIEvent): MatchOdds['odds'] | null {
  const h2hMarkets = event.bookmakers
    .map(b => b.markets.find(m => m.key === 'h2h'))
    .filter(Boolean) as OddsAPIBookmaker['markets'][0][]

  if (h2hMarkets.length === 0) return null

  // Calcular média das odds por outcome
  const accumulate: Record<string, number[]> = {}
  for (const market of h2hMarkets) {
    for (const outcome of market.outcomes) {
      if (!accumulate[outcome.name]) accumulate[outcome.name] = []
      accumulate[outcome.name].push(outcome.price)
    }
  }

  const avg = (arr: number[]) =>
    Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100

  const homeOdds = accumulate[event.home_team] ? avg(accumulate[event.home_team]) : null
  const awayOdds = accumulate[event.away_team] ? avg(accumulate[event.away_team]) : null

  // Draw pode não existir em algumas ligas (ex: eliminatórias)
  const drawKey = Object.keys(accumulate).find(
    k => k !== event.home_team && k !== event.away_team
  )
  const drawOdds = drawKey ? avg(accumulate[drawKey]) : null

  if (!homeOdds || !awayOdds) return null

  return { home: homeOdds, draw: drawOdds, away: awayOdds }
}

// Busca jogos de futebol de hoje (fuso horário Lisboa) com odds reais
export async function fetchTodayMatches(): Promise<MatchOdds[]> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return []

  const { from, to, lisboaDate } = getTodayRangeUTC()

  try {
    // Usar commenceTimeFrom/To para receber apenas jogos de hoje e poupar requests
    const url = new URL('https://api.the-odds-api.com/v4/sports/soccer/odds/')
    url.searchParams.set('apiKey', apiKey)
    url.searchParams.set('regions', 'eu')
    url.searchParams.set('markets', 'h2h')
    url.searchParams.set('dateFormat', 'iso')
    url.searchParams.set('oddsFormat', 'decimal')
    url.searchParams.set('commenceTimeFrom', from)
    url.searchParams.set('commenceTimeTo', to)

    const res = await fetch(url.toString(), { cache: 'no-store' }) // sem cache para dados frescos

    if (!res.ok) {
      const body = await res.text()
      console.error(`Odds API erro ${res.status}:`, body)
      return []
    }

    const events: OddsAPIEvent[] = await res.json()

    console.log(`Odds API: ${events.length} jogos recebidos para Lisboa ${lisboaDate}`)

    // Filtro secundário por data Lisboa (garante consistência mesmo se a API devolver extras)
    const todayMatches = events.filter(e => isMatchToday(e.commence_time, lisboaDate))

    console.log(`Odds API: ${todayMatches.length} jogos após filtro de data Lisboa`)

    return todayMatches
      .map(event => {
        const odds = extractOdds(event)
        if (!odds) return null

        return {
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          league: event.sport_title,
          commenceTime: event.commence_time,
          odds,
        } satisfies MatchOdds
      })
      .filter((m): m is MatchOdds => m !== null)
  } catch (err) {
    console.error('Erro ao buscar odds:', err)
    return []
  }
}

// Formata os jogos para incluir no prompt da IA
export function formatMatchesForPrompt(matches: MatchOdds[]): string {
  return matches
    .map((m, i) => {
      const hora = new Date(m.commenceTime).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Lisbon',
      })
      const drawStr = m.odds.draw != null ? ` | Empate: ${m.odds.draw}` : ''
      return `${i + 1}. ${m.homeTeam} vs ${m.awayTeam} (${m.league}) — ${hora}h
   Odds: Casa ${m.odds.home}${drawStr} | Fora ${m.odds.away}`
    })
    .join('\n')
}
