// Script para apagar os picks de hoje do Supabase
// Corre com: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-today-picks.mjs
// Ou com o .env.local carregado: node --env-file=.env.local scripts/delete-today-picks.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌ Variáveis em falta: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Corre: node --env-file=.env.local scripts/delete-today-picks.mjs')
  process.exit(1)
}

const supabase = createClient(url, key)
const today = new Date().toISOString().split('T')[0]
console.log('A apagar picks de:', today)

const { data, error } = await supabase
  .from('daily_picks')
  .delete()
  .eq('date', today)
  .select()

if (error) {
  console.error('Erro:', error.message)
  process.exit(1)
}

console.log(`✅ ${data.length} pick(s) apagado(s):`)
data.forEach(p => console.log(' -', p.match, '|', p.pick_type))
