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

  // Draw pode não existir em algumas ligas
  const drawKey = Object.keys(accumulate).find(k => k !== event.home_team && k !== event.away_team)
  const drawOdds = drawKey ? avg(accumulate[drawKey]) : null

  if (!homeOdds || !awayOdds) return null

  return { home: homeOdds, draw: drawOdds, away: awayOdds }
}

// Busca jogos de futebol de hoje com odds reais
export async function fetchTodayMatches(): Promise<MatchOdds[]> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&dateFormat=iso&oddsFormat=decimal`,
      { next: { revalidate: 3600 } } // cache 1 hora para poupar requests
    )

    if (!res.ok) {
      console.error(`Odds API erro: ${res.status} ${res.statusText}`)
      return []
    }

    const events: OddsAPIEvent[] = await res.json()

    // Filtrar apenas jogos de hoje (UTC)
    const todayUTC = new Date().toISOString().split('T')[0]
    const todayMatches = events.filter(e => e.commence_time.startsWith(todayUTC))

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
