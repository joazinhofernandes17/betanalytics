import { Badge } from '@/components/ui/badge'
import type { PickResult } from '@/types'

interface ResultBadgeProps {
  result: PickResult
}

const RESULT_CONFIG: Record<PickResult, { label: string; variant: 'win' | 'loss' | 'void' | 'pending' }> = {
  win:     { label: '✅ Win',      variant: 'win'     },
  loss:    { label: '❌ Loss',     variant: 'loss'    },
  void:    { label: '⚪ Anulada',  variant: 'void'    },
  pending: { label: '⏳ Pendente', variant: 'pending' },
}

// Badge colorido com resultado da aposta
export function ResultBadge({ result }: ResultBadgeProps) {
  const config = RESULT_CONFIG[result]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
