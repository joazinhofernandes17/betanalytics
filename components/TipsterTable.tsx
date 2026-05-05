import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getTipsterLevel, LEVEL_COLORS } from '@/types'
import { cn } from '@/lib/utils'
import type { TipsterStats } from '@/types'

interface TipsterTableProps {
  stats: TipsterStats[]
  currentUserId?: string
}

// Tabela pública de ranking de tipsters
export function TipsterTable({ stats, currentUserId }: TipsterTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipster</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Taxa Acerto</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Apostas</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Wins</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Lucro/Perda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {stats.map((s, idx) => {
            const profile = s.profiles
            const level = getTipsterLevel(s.total_bets)
            const isCurrentUser = s.user_id === currentUserId
            const initials = profile?.username?.slice(0, 2).toUpperCase() ?? '??'

            return (
              <tr
                key={s.user_id}
                className={cn(
                  'bg-zinc-900 hover:bg-zinc-800/50 transition-colors',
                  isCurrentUser && 'bg-green-500/5 hover:bg-green-500/10 border-l-2 border-green-500'
                )}
              >
                <td className="px-4 py-4">
                  <span className={cn(
                    'text-lg font-bold',
                    idx === 0 && 'text-amber-400',
                    idx === 1 && 'text-zinc-300',
                    idx === 2 && 'text-amber-700',
                    idx > 2 && 'text-zinc-500'
                  )}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? ''} alt={profile?.username} />
                      <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-zinc-100">
                        {profile?.username ?? 'Anónimo'}
                        {isCurrentUser && <span className="ml-2 text-xs text-green-400">(tu)</span>}
                      </p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', LEVEL_COLORS[level])}>
                        {level}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={cn(
                    'font-semibold',
                    s.win_rate >= 75 ? 'text-green-400' : s.win_rate >= 60 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {Number(s.win_rate).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">{s.total_bets}</td>
                <td className="px-4 py-4 text-center text-zinc-300">{s.wins}</td>
                <td className="px-4 py-4 text-right">
                  <span className={cn(
                    'font-semibold',
                    Number(s.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {Number(s.profit_loss) >= 0 ? '+' : ''}{Number(s.profit_loss).toFixed(2)}€
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
