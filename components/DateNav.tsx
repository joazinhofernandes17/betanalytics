'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, subDays, parseISO, isToday } from 'date-fns'
import { pt } from 'date-fns/locale'

interface DateNavProps {
  currentDate: string // YYYY-MM-DD
}

// Navegação entre datas nas páginas de apostas
export function DateNav({ currentDate }: DateNavProps) {
  const router = useRouter()
  const date = parseISO(currentDate)
  const prevDate = format(subDays(date, 1), 'yyyy-MM-dd')
  const nextDate = format(addDays(date, 1), 'yyyy-MM-dd')
  const isCurrentDay = isToday(date)

  function navigate(d: string) {
    router.push(`/apostas?data=${d}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => navigate(prevDate)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700">
        <Calendar className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-100">
          {isCurrentDay
            ? 'Hoje'
            : format(date, "d 'de' MMM", { locale: pt })}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate(nextDate)}
        disabled={isCurrentDay}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
