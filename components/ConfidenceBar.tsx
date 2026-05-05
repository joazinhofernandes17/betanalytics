import { cn, confidenceColor } from '@/lib/utils'

interface ConfidenceBarProps {
  pct: number
  showLabel?: boolean
  className?: string
}

// Barra visual de confiança da aposta (75-95%)
export function ConfidenceBar({ pct, showLabel = true, className }: ConfidenceBarProps) {
  const color = confidenceColor(pct)

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Confiança</span>
          <span className={cn('font-semibold', pct >= 80 ? 'text-green-400' : 'text-amber-400')}>
            {pct}%
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-zinc-700">
        <div
          className={cn('h-2 rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
