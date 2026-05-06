# BetAnalytics

Plataforma de análise de apostas desportivas de futebol alimentada por IA (Claude AI).
Gera diariamente as 3 melhores apostas com taxa de acerto superior a 75%, dashboard pessoal e ranking público de tipsters.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase (PostgreSQL + Auth)
- **IA**: Claude claude-sonnet-4-20250514 via Anthropic SDK
- **UI**: Componentes customizados inspirados em shadcn/ui + Radix UI
- **Deploy**: Vercel (com Cron Jobs)

---

## Setup Local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd betanalytics
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preenche os valores em `.env.local` (ver secção abaixo).

### 3. Configurar Supabase

1. Cria um projeto em [supabase.com](https://supabase.com)
2. Vai a **SQL Editor** e executa o ficheiro `supabase/migrations.sql`
3. Em **Authentication > Providers**, ativa **Google** (opcional, para OAuth)
4. Copia as keys de **Settings > API** para o `.env.local`

### 4. Configurar Anthropic

1. Cria uma conta em [console.anthropic.com](https://console.anthropic.com)
2. Gera uma API key em **Settings > API Keys**
3. Adiciona ao `.env.local` como `ANTHROPIC_API_KEY`

### 5. Executar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (acesso admin sem RLS) |
| `GROQ_API_KEY` | API key da Groq (modelo llama-3.3-70b-versatile) |
| `ODDS_API_KEY` | API key da The Odds API — **opcional** (ver abaixo) |
| `CRON_SECRET` | Segredo para proteger endpoints de cron/admin |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação (sem trailing slash) |
| `ADMIN_EMAILS` | Emails de admin separados por vírgula |

### The Odds API (opcional mas recomendado)

A integração com [the-odds-api.com](https://the-odds-api.com) permite que a IA analise **jogos reais de hoje** com odds reais dos bookmakers europeus, em vez de gerar jogos fictícios.

**Como obter a chave gratuita:**
1. Regista-te em [the-odds-api.com](https://the-odds-api.com)
2. O plano gratuito dá **500 requests/mês** (suficiente para uso diário)
3. Copia a API key para `ODDS_API_KEY` no `.env.local` e nas variáveis da Vercel

**Comportamento com/sem a chave:**
- ✅ **Com `ODDS_API_KEY`**: busca jogos reais de hoje → IA analisa odds reais → picks de valor real
- ⚠️ **Sem `ODDS_API_KEY`** (fallback): IA gera picks com base no seu conhecimento geral de futebol

---

## Gerar Picks Manualmente

Durante desenvolvimento, podes gerar picks via curl:

```bash
curl -X POST http://localhost:3000/api/generate-picks \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

Ou usa o painel de admin em `/admin` (requer login com email de admin).

---

## Deploy na Vercel

### 1. Push para GitHub

```bash
git add .
git commit -m "feat: BetAnalytics inicial"
git push
```

### 2. Importar na Vercel

1. Vai a [vercel.com](https://vercel.com) e importa o repositório
2. Em **Environment Variables**, adiciona todas as variáveis do `.env.local`
3. O deploy é automático

### 3. Cron Job

O ficheiro `vercel.json` já está configurado para executar o cron às **08:00 Lisboa (07:00 UTC)** todos os dias.

A Vercel enviará um pedido GET para `/api/cron/daily-picks` com o header `Authorization: Bearer CRON_SECRET`.

### 4. Domínio personalizado

Em **Settings > Domains** da Vercel, adiciona o teu domínio e atualiza `NEXT_PUBLIC_APP_URL`.

---

## Estrutura do Projeto

```
betanalytics/
├── app/
│   ├── page.tsx              # Landing page pública
│   ├── layout.tsx            # Layout raiz
│   ├── globals.css           # Estilos globais
│   ├── apostas/              # Apostas do dia (requer login)
│   ├── dashboard/            # Dashboard pessoal (requer login)
│   ├── ranking/              # Ranking de tipsters (público)
│   ├── auth/                 # Login e registo
│   ├── admin/                # Painel de admin
│   └── api/
│       ├── generate-picks/   # Gerar picks com Claude AI
│       ├── cron/daily-picks/ # Cron job da Vercel
│       ├── picks/            # Buscar picks por data
│       ├── user-bets/        # Guardar/listar apostas
│       ├── admin/            # Atualizar resultados
│       └── stats/            # Estatísticas globais
├── components/
│   ├── ui/                   # Componentes base (Button, Card, etc.)
│   ├── PickCard.tsx          # Card de aposta
│   ├── ConfidenceBar.tsx     # Barra de confiança
│   ├── ResultBadge.tsx       # Badge Win/Loss/Void/Pendente
│   ├── StatsGrid.tsx         # Grelha de métricas
│   ├── TipsterTable.tsx      # Tabela de ranking
│   ├── DateNav.tsx           # Navegação entre datas
│   └── Navbar.tsx            # Barra de navegação
├── lib/
│   ├── utils.ts              # Utilitários gerais
│   └── supabase/
│       ├── client.ts         # Cliente Supabase (browser)
│       └── server.ts         # Cliente Supabase (servidor)
├── types/
│   └── index.ts              # Tipos TypeScript globais
├── supabase/
│   └── migrations.sql        # SQL das tabelas e políticas RLS
├── middleware.ts             # Proteção de rotas
├── .env.local.example        # Template de variáveis de ambiente
└── vercel.json               # Configuração Vercel + Cron
```

---

## Base de Dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de utilizadores (extende auth.users) |
| `daily_picks` | Apostas geradas pela IA |
| `user_bets` | Histórico pessoal de cada utilizador |
| `tipster_stats` | Estatísticas calculadas por utilizador |

### RLS (Row Level Security)

- `profiles`: leitura pública, edição apenas pelo próprio
- `daily_picks`: leitura por autenticados, escrita apenas por service role
- `user_bets`: cada utilizador acede apenas às suas
- `tipster_stats`: leitura pública, escrita apenas por service role

---

## Apostas Responsáveis

Esta plataforma é apenas para fins informativos e de entretenimento.
Apostas envolvem risco de perda financeira. Joga apenas o que podes perder. +18.
