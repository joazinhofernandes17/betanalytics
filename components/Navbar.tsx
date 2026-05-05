'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, BarChart3, Trophy, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavbarProps {
  user: Profile | null
}

const NAV_LINKS = [
  { href: '/apostas', label: 'Apostas', icon: TrendingUp },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
]

// Barra de navegação principal
export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-zinc-100">
              Bet<span className="text-green-400">Analytics</span>
            </span>
          </Link>

          {/* Links de navegação */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Autenticação */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                  <LogOut className="h-4 w-4 text-zinc-400" />
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Navegação mobile */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                pathname.startsWith(href)
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
