// Tipos globais da aplicação BetAnalytics

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type PickResult = 'win' | 'loss' | 'void' | 'pending'

export interface DailyPick {
  id: string
  date: string
  match: string
  league: string
  pick_type: string
  odds: number
  confidence_pct: number
  analysis: string
  result: PickResult
  created_at: string
}

export interface UserBet {
  id: string
  user_id: string
  pick_id: string
  stake: number | null
  saved_at: string
  // joins
  daily_picks?: DailyPick
}

export interface TipsterStats {
  user_id: string
  total_bets: number
  wins: number
  win_rate: number
  profit_loss: number
  updated_at: string
  // joins
  profiles?: Profile
}

// Resposta da IA ao gerar picks
export interface AIPickResponse {
  match: string
  league: string
  pick_type: string
  odds: number
  confidence_pct: number
  analysis: string
}

// Badge de nível do tipster
export type TipsterLevel = 'Bronze' | 'Prata' | 'Ouro' | 'Platina'

export function getTipsterLevel(totalBets: number): TipsterLevel {
  if (totalBets >= 100) return 'Platina'
  if (totalBets >= 50) return 'Ouro'
  if (totalBets >= 20) return 'Prata'
  return 'Bronze'
}

// Cores por nível
export const LEVEL_COLORS: Record<TipsterLevel, string> = {
  Bronze: 'text-amber-700 bg-amber-100',
  Prata: 'text-slate-500 bg-slate-100',
  Ouro: 'text-yellow-600 bg-yellow-100',
  Platina: 'text-cyan-600 bg-cyan-100',
}
