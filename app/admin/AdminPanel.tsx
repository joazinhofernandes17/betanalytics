'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResultBadge } from '@/components/ResultBadge'
import { StatsGrid } from '@/components/StatsGrid'
import { toast } from 'sonner'
import { formatOdds } from '@/lib/utils'
import { Zap, Users, Target, BarChart3, RefreshCw } from 'lucide-react'
import type { DailyPick, PickResult } from '@/types'

interface AdminPanelProps {
  todayPicks: DailyPick[]
  stats: {
    totalPicks: number
    totalBets: number
    totalUsers: number
  }
}

// Painel de administração da plataforma
export function AdminPanel({ todayPicks: initialPicks, stats }: AdminPanelProps) {
  const [picks, setPicks] = useState(initialPicks)
  const [generating, setGenerating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleGeneratePicks() {
    setGenerating(true)
    try {
      // Usa rota admin que valida sessão no servidor (sem expor CRON_SECRET)
      const res = await fetch('/api/admin/generate-picks', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        if (data.message) {
          toast.info(data.message)
        } else {
          toast.success(`${data.picks?.length || 0} apostas geradas com sucesso!`)
          if (data.picks) setPicks(data.picks)
        }
      } else {
        toast.error(data.error || 'Erro ao gerar picks')
      }
    } catch {
      toast.error('Erro de rede')
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpdateResult(pickId: string, result: PickResult) {
    setUpdatingId(pickId)
    try {
      // Usa sessão Supabase para autenticar (sem CRON_SECRET no cliente)
      const res = await fetch('/api/admin/update-result', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickId, result }),
      })

      if (!res.ok) throw new Error()

      setPicks(prev =>
        prev.map(p => (p.id === pickId ? { ...p, result } : p))
      )
      toast.success('Resultado atualizado!')
    } catch {
      toast.error('Erro ao atualizar resultado')
    } finally {
      setUpdatingId(null)
    }
  }

  const gridStats = [
    { label: 'Utilizadores', value: stats.totalUsers, icon: Users, color: 'bg-zinc-800' },
    { label: 'Picks Gerados', value: stats.totalPicks, icon: Target, color: 'bg-green-500/20' },
    { label: 'Apostas Guardadas', value: stats.totalBets, icon: BarChart3, color: 'bg-amber-500/20' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Admin Panel</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestão da plataforma BetAnalytics</p>
        </div>
        <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
          Área Restrita
        </Badge>
      </div>

      {/* Estatísticas gerais */}
      <StatsGrid stats={gridStats as any} />

      {/* Gerar picks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Gerar Apostas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Gera as 3 apostas do dia com análise da Claude AI. Se já existirem picks para hoje, a operação será ignorada.
          </p>
          <Button onClick={handleGeneratePicks} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                A gerar...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Gerar picks de hoje
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Atualizar resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apostas de Hoje — Atualizar Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {picks.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma aposta gerada hoje.</p>
          ) : (
            <div className="space-y-4">
              {picks.map(pick => (
                <div
                  key={pick.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{pick.match}</p>
                    <p className="text-sm text-zinc-400">{pick.pick_type} · {formatOdds(pick.odds)}</p>
                    <div className="mt-1">
                      <ResultBadge result={pick.result} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['win', 'loss', 'void', 'pending'] as PickResult[]).map(r => (
                      <Button
                        key={r}
                        size="sm"
                        variant={pick.result === r ? 'default' : 'outline'}
                        disabled={updatingId === pick.id}
                        onClick={() => handleUpdateResult(pick.id, r)}
                        className="text-xs"
                      >
                        {r === 'win' ? '✅ Win' : r === 'loss' ? '❌ Loss' : r === 'void' ? '⚪ Void' : '⏳ Pendente'}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
