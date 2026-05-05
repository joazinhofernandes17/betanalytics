'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { PickCard } from '@/components/PickCard'
import { DateNav } from '@/components/DateNav'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { todayISO, formatDate } from '@/lib/utils'
import type { DailyPick } from '@/types'
import { CalendarX } from 'lucide-react'

export default function ApostasPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('data') || todayISO()

  const [picks, setPicks] = useState<DailyPick[]>([])
  const [savedPickIds, setSavedPickIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPicks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/picks?date=${dateParam}`)
      if (!res.ok) throw new Error('Erro ao carregar apostas')
      const data = await res.json()
      setPicks(data.picks)
      setSavedPickIds(data.savedPickIds)
    } catch {
      toast.error('Erro ao carregar apostas')
    } finally {
      setLoading(false)
    }
  }, [dateParam])

  useEffect(() => {
    fetchPicks()
  }, [fetchPicks])

  async function handleSave(pickId: string) {
    try {
      const res = await fetch('/api/user-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickId }),
      })

      if (res.status === 409) {
        toast.info('Aposta já guardada no teu histórico')
        return
      }
      if (!res.ok) throw new Error()

      setSavedPickIds(prev => [...prev, pickId])
      toast.success('Aposta guardada no histórico!')
    } catch {
      toast.error('Erro ao guardar aposta')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Apostas do Dia</h1>
          <p className="text-sm text-zinc-400 mt-1">{formatDate(dateParam)}</p>
        </div>
        <DateNav currentDate={dateParam} />
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-zinc-800 p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Apostas */}
      {!loading && picks.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {picks.map(pick => (
            <PickCard
              key={pick.id}
              pick={pick}
              isSaved={savedPickIds.includes(pick.id)}
              onSave={handleSave}
              showSaveButton={true}
            />
          ))}
        </div>
      )}

      {/* Sem apostas */}
      {!loading && picks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarX className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400">Sem apostas para esta data</h3>
          <p className="text-sm text-zinc-500 mt-2">
            As apostas são geradas automaticamente às 08:00 todos os dias.
          </p>
        </div>
      )}
    </div>
  )
}
