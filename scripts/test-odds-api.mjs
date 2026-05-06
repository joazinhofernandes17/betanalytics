// Script de diagnóstico da Odds API
// Corre com: node scripts/test-odds-api.mjs

const API_KEY = process.env.ODDS_API_KEY || '36ef31177c55a9c28de97224d119459d'
const TODAY_LISBOA = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })

console.log('=== BetAnalytics — Teste Odds API ===')
console.log('Data hoje (Lisboa):', TODAY_LISBOA)
console.log('Data hoje (UTC):   ', new Date().toISOString().split('T')[0])
console.log('')

const url = `https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&dateFormat=iso&oddsFormat=decimal`

fetch(url)
  .then(async r => {
    console.log('HTTP Status:', r.status, r.statusText)
    console.log('Requests restantes:', r.headers.get('x-requests-remaining'))
    console.log('Requests usados:   ', r.headers.get('x-requests-used'))
    console.log('')

    if (!r.ok) {
      const text = await r.text()
      console.error('Erro da API:', text)
      return
    }

    const events = await r.json()

    if (!Array.isArray(events)) {
      console.error('Resposta inesperada:', events)
      return
    }

    console.log(`Total de jogos retornados: ${events.length}`)
    console.log('')
    console.log('--- Lista de jogos com datas ---')

    const byDate = {}
    events.forEach((e, i) => {
      const utcDate = e.commence_time.split('T')[0]
      const lisboaDate = new Date(e.commence_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
      const lisboaTime = new Date(e.commence_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' })

      if (!byDate[lisboaDate]) byDate[lisboaDate] = []
      byDate[lisboaDate].push({ match: `${e.home_team} vs ${e.away_team}`, league: e.sport_title, utcDate, lisboaTime })
    })

    Object.entries(byDate).sort().forEach(([date, matches]) => {
      const isToday = date === TODAY_LISBOA
      console.log(`\n📅 ${date}${isToday ? ' ← HOJE' : ''} (${matches.length} jogos)`)
      matches.forEach(m => {
        console.log(`   ${m.lisboaTime}h  ${m.match}  [${m.league}]`)
      })
    })

    const todayMatches = events.filter(e =>
      new Date(e.commence_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' }) === TODAY_LISBOA
    )
    console.log('')
    console.log(`=== RESULTADO: ${todayMatches.length} jogo(s) para hoje (${TODAY_LISBOA}) ===`)

    if (todayMatches.length === 0) {
      console.log('⚠️  Sem jogos hoje — o sistema usará o fallback (IA sem dados reais)')
    } else {
      console.log('✅ Jogos encontrados — a IA vai analisar estes jogos reais')
    }
  })
  .catch(err => console.error('Erro de rede:', err.message))
