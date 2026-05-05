import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'BetAnalytics — As 3 melhores apostas de futebol',
    template: '%s | BetAnalytics',
  },
  description:
    'Plataforma de análise de apostas desportivas com IA. Recebe as 3 melhores apostas de futebol todos os dias, com análise detalhada e taxa de acerto superior a 75%.',
  keywords: ['apostas', 'futebol', 'análise', 'IA', 'tipster', 'Portugal'],
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    siteName: 'BetAnalytics',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
            },
          }}
        />
      </body>
    </html>
  )
}
