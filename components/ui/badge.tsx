import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-green-500 text-white',
        secondary: 'border-transparent bg-zinc-700 text-zinc-100',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'border-zinc-700 text-zinc-300',
        win: 'border-transparent bg-green-500/20 text-green-400 border-green-500/30',
        loss: 'border-transparent bg-red-500/20 text-red-400 border-red-500/30',
        void: 'border-transparent bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
        pending: 'border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30',
        gold: 'border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
