import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  description?: string
}

interface StatsGridProps {
  stats: StatItem[]
  className?: string
}

// Grelha de métricas estatísticas do dashboard
export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', className)}>
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', stat.color ?? 'bg-zinc-800')}>
                  <Icon className="h-4 w-4 text-zinc-100" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-zinc-500">{stat.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
