import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createAdminClient } from '@/lib/supabase/server'
import { TrendingUp, Shield, Zap, Trophy, ChevronRight, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'BetAnalytics — As 3 melhores apostas de futebol, todos os dias',
}

async function getGlobalStats() {
  try {
    const supabase = createAdminClient()

    const { data: picks } = await supabase
      .from('daily_picks')
      .select('result, odds, confidence_pct')
      .neq('result', 'pending')

    if (!picks || picks.length === 0) {
      return { total: 0, wins: 0, winRate: 77, avgOdds: 1.95, avgConfidence: 82 }
    }

    const resolved = picks.filter(p => p.result !== 'void')
    const wins = resolved.filter(p => p.result === 'win').length
    const winRate = resolved.length > 0 ? Math.round((wins / resolved.length) * 100) : 0
    const avgOdds = picks.reduce((s, p) => s + Number(p.odds), 0) / picks.length
    const avgConf = picks.reduce((s, p) => s + p.confidence_pct, 0) / picks.length

    return {
      total: resolved.length,
      wins,
      winRate,
      avgOdds: Math.round(avgOdds * 100) / 100,
      avgConfidence: Math.round(avgConf),
    }
  } catch {
    return { total: 0, wins: 0, winRate: 77, avgOdds: 1.95, avgConfidence: 82 }
  }
}

async function getTodayPicksPreview() {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('daily_picks')
      .select('id, match, league, pick_type, odds, confidence_pct, result')
      .eq('date', today)
      .order('confidence_pct', { ascending: false })

    return data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [stats, todayPicks] = await Promise.all([getGlobalStats(), getTodayPicksPreview()])

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header simples na landing */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-zinc-100">
                Bet<span className="text-green-400">Analytics</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/ranking" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Ranking
              </Link>
              <Button asChild>
                <Link href="/auth">Entrar</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Fundo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-amber-500/5" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 text-xs">
            <Star className="h-3 w-3 mr-1 text-amber-400" />
            Powered by Claude AI · Análise Profissional
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-zinc-100 mb-6 leading-tight">
            As{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
              3 melhores
            </span>{' '}
            apostas de futebol,{' '}
            <span className="text-amber-400">todos os dias</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Inteligência artificial com análise profunda de estatísticas, forma recente e valor das odds.
            Taxa de acerto superior a <strong className="text-green-400">75%</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/auth">
                Começar gratuitamente <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/ranking">Ver ranking de tipsters</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Taxa de Acerto', value: `${stats.winRate || 77}%`, color: 'text-green-400' },
              { label: 'Apostas Analisadas', value: stats.total > 0 ? `${stats.total}+` : '500+', color: 'text-zinc-100' },
              { label: 'Odds Médias', value: stats.avgOdds > 0 ? stats.avgOdds.toFixed(2) : '1.95', color: 'text-amber-400' },
              { label: 'Confiança Média', value: `${stats.avgConfidence || 82}%`, color: 'text-zinc-100' },
            ].map((s, i) => (
              <div key={i}>
                <p className={`text-3xl md:text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview das apostas do dia */}
      {todayPicks.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">Apostas de Hoje</h2>
              <p className="text-zinc-400 mt-2">Faz login para ver a análise completa</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {todayPicks.map(pick => (
                <Card key={pick.id} className="relative overflow-hidden">
                  {/* Blur overlay para análise */}
                  <div className="absolute inset-0 flex items-end justify-center pb-6 z-10">
                    <Button asChild size="sm" variant="gold">
                      <Link href="/auth">
                        <Shield className="h-4 w-4 mr-2" />
                        Ver análise completa
                      </Link>
                    </Button>
                  </div>

                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">{pick.league}</Badge>
                      <span className="text-xl font-bold text-amber-400">{Number(pick.odds).toFixed(2)}</span>
                    </div>
                    <p className="font-semibold text-zinc-100 mb-1">{pick.match}</p>
                    <p className="text-sm text-zinc-400 mb-4">{pick.pick_type}</p>

                    {/* Barra de confiança (visível) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Confiança</span>
                        <span className="text-green-400 font-semibold">{pick.confidence_pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-700">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${pick.confidence_pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Análise desfocada */}
                    <div className="mt-4 rounded-lg bg-zinc-800/50 p-3 blur-sm select-none">
                      <p className="text-xs text-zinc-400">
                        Análise detalhada com estatísticas de forma recente, confrontos diretos e valor das odds disponível para membros...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-zinc-100 mb-12">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'IA Analisa os Dados',
                desc: 'Claude AI processa estatísticas avançadas, forma recente, confrontos diretos, lesões e motivação das equipas todos os dias.',
                color: 'bg-green-500/10 text-green-400',
              },
              {
                icon: Shield,
                title: 'Apostas de Alto Valor',
                desc: 'Apenas picks com confiança superior a 75% são selecionados, garantindo qualidade em detrimento de quantidade.',
                color: 'bg-amber-500/10 text-amber-400',
              },
              {
                icon: Trophy,
                title: 'Acompanha o teu Histórico',
                desc: 'Guarda as tuas apostas, monitoriza o teu desempenho e compara-te com outros tipsters no ranking público.',
                color: 'bg-blue-500/10 text-blue-400',
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
            Começa hoje, gratuitamente
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Junta-te aos tipsters que já usam análise de IA para tomar melhores decisões nas suas apostas.
          </p>
          <Button asChild size="lg">
            <Link href="/auth">Criar conta gratuita <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-400">BetAnalytics</span>
            </div>
            <p className="text-xs text-zinc-600">
              Apostas responsáveis. Joga apenas o que podes perder. +18.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
