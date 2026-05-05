import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

// Utilitário padrão shadcn/ui para classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar data em português
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: pt })
}

// Formatar data curta
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: pt })
}

// Data de hoje no formato YYYY-MM-DD
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Cor da barra de confiança
export function confidenceColor(pct: number): string {
  if (pct >= 85) return 'bg-green-500'
  if (pct >= 80) return 'bg-green-400'
  if (pct >= 75) return 'bg-yellow-500'
  return 'bg-yellow-400'
}

// Formatar odds com 2 casas decimais
export function formatOdds(odds: number): string {
  return odds.toFixed(2)
}

// Calcular ROI: ((ganhos - apostas) / apostas) * 100
export function calculateROI(wins: number, total: number, avgOdds = 2.0): number {
  if (total === 0) return 0
  const losses = total - wins
  const profit = wins * (avgOdds - 1) - losses
  return Math.round((profit / total) * 100 * 10) / 10
}
