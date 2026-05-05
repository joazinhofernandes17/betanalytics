'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfidenceBar } from '@/components/ConfidenceBar'
import { ResultBadge } from '@/components/ResultBadge'
import { formatOdds } from '@/lib/utils'
import { ChevronDown, ChevronUp, Bookmark, BookmarkCheck } from 'lucide-react'
import type { DailyPick } from '@/types'

interface PickCardProps {
  pick: DailyPick
  isSaved?: boolean
  onSave?: (pickId: string) => Promise<void>
  showSaveButton?: boolean
}

// Card completo de uma aposta com análise expansível
export function PickCard({ pick, isSaved = false, onSave, showSaveButton = true }: PickCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(pick.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="text-xs">
                {pick.league}
              </Badge>
              <ResultBadge result={pick.result} />
            </div>
            <h3 className="font-bold text-lg text-zinc-100 truncate">{pick.match}</h3>
          </div>
          {showSaveButton && onSave && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={saving || isSaved}
              title={isSaved ? 'Guardado' : 'Guardar no histórico'}
              className="shrink-0"
            >
              {isSaved
                ? <BookmarkCheck className="h-5 w-5 text-green-400" />
                : <Bookmark className="h-5 w-5 text-zinc-400" />
              }
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tipo de aposta e odds */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Aposta</p>
            <p className="font-semibold text-zinc-100">{pick.pick_type}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Odds</p>
            <p className="text-2xl font-bold text-amber-400">{formatOdds(pick.odds)}</p>
          </div>
        </div>

        {/* Barra de confiança */}
        <ConfidenceBar pct={pick.confidence_pct} />

        {/* Análise expansível */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            {expanded ? (
              <>Esconder análise <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Ver análise completa <ChevronDown className="h-4 w-4" /></>
            )}
          </button>

          {expanded && (
            <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 border border-zinc-700/50">
              <p className="text-sm text-zinc-300 leading-relaxed">{pick.analysis}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
