// Integração com The Odds API (https://the-odds-api.com)
// Plano gratuito: 500 requests/mês
// Cada chamada a fetchTodayMatches() usa até SPORT_KEYS.length requests

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

// Competições a monitorizar
const SPORT_KEYS = [
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_uefa_euro_qualification',
  'soccer_portugal_primeira_liga',
  'soccer_spain_la_liga',
  'soccer_england_premier_league',
  'soccer_england_league1',
  'soccer_england_league2',
  'soccer_france_ligue_one',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_netherlands_eredivisie',
  'soccer_turkey_super_league',
  'soccer_fifa_world_cup',
]

// Retorna o início e fim do dia de hoje no fuso horário de Lisboa convertido para UTC
function getTodayRangeUTC(): { from: string; to: string; lisboaDate: string } {
  const lisboaDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Lisbon',
  })

  // Midnight Lisboa → UTC (compensar offset do servidor)
  const from = new Date(`${lisboaDate}T00:00:00`)
  const offset = from.getTimezoneOffset()
  const fromUTC = new Date(from.getTime() - offset * 60000)

  const to = new Date(`${lisboaDate}T23:59:59`)
  const toUTC = new Date(to.getTime() - offset * 60000)

  return {
    from: fromUTC.toISOString(),
    to: toUTC.toISOString(),
    lisboaDate,
  }
}

// Verifica se um commence_time (UTC) cai no dia de hoje em Lisboa
function isMatchToday(commenceTime: string, lisboaDate: string): boolean {
  return new Date(commenceTime).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Lisbon',
  }) === lisboaDate
}

// Extrai odds médias de h2h entre todos os bookmakers disponíveis
function extractOdds(event: OddsAPIEvent): MatchOdds['odds'] | null {
  const h2hMarkets = event.bookmakers
    .map(b => b.markets.find(m => m.key === 'h2h'))
    .filter(Boolean) as OddsAPIBookmaker['markets'][0][]

  if (h2hMarkets.length === 0) return null

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
  const drawKey = Object.keys(accumulate).find(
    k => k !== event.home_team && k !== event.away_team
  )
  const drawOdds = drawKey ? avg(accumulate[drawKey]) : null

  if (!homeOdds || !awayOdds) return null

  return { home: homeOdds, draw: drawOdds, away: awayOdds }
}

// Busca jogos de uma liga específica
async function fetchLeagueMatches(
  sportKey: string,
  apiKey: string,
  from: string,
  to: string,
  lisboaDate: string
): Promise<MatchOdds[]> {
  try {
    const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`)
    url.searchParams.set('apiKey', apiKey)
    url.searchParams.set('regions', 'eu')
    url.searchParams.set('markets', 'h2h')
    url.searchParams.set('dateFormat', 'iso')
    url.searchParams.set('oddsFormat', 'decimal')
    url.searchParams.set('commenceTimeFrom', from)
    url.searchParams.set('commenceTimeTo', to)

    const res = await fetch(url.toString(), { cache: 'no-store' })

    // 404 significa que a liga não tem jogos agendados — não é erro
    if (res.status === 404) return []

    if (!res.ok) {
      console.error(`Odds API [${sportKey}] erro ${res.status}`)
      return []
    }

    const events: OddsAPIEvent[] = await res.json()

    return events
      .filter(e => isMatchToday(e.commence_time, lisboaDate))
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
    console.error(`Odds API [${sportKey}] falhou:`, err)
    return []
  }
}

// Busca jogos de hoje em todas as ligas configuradas (em paralelo)
export async function fetchTodayMatches(): Promise<MatchOdds[]> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return []

  const { from, to, lisboaDate } = getTodayRangeUTC()

  // Fetch paralelo a todas as ligas para minimizar latência
  const results = await Promise.all(
    SPORT_KEYS.map(key => fetchLeagueMatches(key, apiKey, from, to, lisboaDate))
  )

  // Combinar e deduplicar por id implícito (home+away+commence_time)
  const seen = new Set<string>()
  const allMatches: MatchOdds[] = []

  for (const leagueMatches of results) {
    for (const match of leagueMatches) {
      const key = `${match.homeTeam}|${match.awayTeam}|${match.commenceTime}`
      if (!seen.has(key)) {
        seen.add(key)
        allMatches.push(match)
      }
    }
  }

  // Ordenar por hora de início
  allMatches.sort((a, b) =>
    new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
  )

  console.log(`Odds API: ${allMatches.length} jogo(s) encontrado(s) para Lisboa ${lisboaDate}`)
  return allMatches
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
      return `${i + 1}. ${m.homeTeam} vs ${m.awayTeam} (${m.league}) — ${hora}h\n   Odds: Casa ${m.odds.home}${drawStr} | Fora ${m.odds.away}`
    })
    .join('\n')
}
