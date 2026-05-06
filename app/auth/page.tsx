'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { TrendingUp, Globe } from 'lucide-react'
import Link from 'next/link'

type Mode = 'login' | 'register'

// Componente interno que usa useSearchParams — precisa de estar dentro de <Suspense>
function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/apostas'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!username.trim() || username.length < 3) {
          toast.error('Username deve ter pelo menos 3 caracteres')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim() },
          },
        })

        if (error) throw error
        toast.success('Conta criada! Verifica o teu email para confirmar o registo.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        toast.success('Bem-vindo de volta!')
        router.push(redirect)
        router.refresh()
      }
    } catch (err: any) {
      const msg = err?.message || 'Ocorreu um erro'
      if (msg.includes('Invalid login credentials')) {
        toast.error('Email ou password incorretos')
      } else if (msg.includes('User already registered')) {
        toast.error('Este email já está registado')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) toast.error('Erro ao iniciar sessão com Google')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Acede às apostas e ao teu dashboard'
            : 'Junta-te à comunidade de tipsters'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          type="button"
        >
          <Globe className="h-4 w-4 mr-2" />
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs text-zinc-500">
            <span className="bg-zinc-900 px-2">ou</span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="o_meu_username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Apenas letras, números e underscore"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        {/* Alternar modo */}
        <p className="text-center text-sm text-zinc-400">
          {mode === 'login' ? (
            <>
              Não tens conta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tens conta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function AuthFormSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Skeleton className="h-6 w-40 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

// Página principal envolve AuthForm em Suspense (obrigatório para useSearchParams)
export default function AuthPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-100">
              Bet<span className="text-green-400">Analytics</span>
            </span>
          </Link>
        </div>

        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthForm />
        </Suspense>

        <p className="text-center text-xs text-zinc-600">
          Ao registares-te, aceitas apostar de forma responsável. +18.
        </p>
      </div>
    </div>
  )
}
