-- ============================================================
-- BetAnalytics — Migrações SQL para Supabase
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Perfis de utilizadores (extende auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger para criar perfil automaticamente ao registar
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Apostas diárias geradas pela IA
create table if not exists daily_picks (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  match text not null,
  league text not null,
  pick_type text not null,
  odds decimal(5,2) not null,
  confidence_pct integer not null check (confidence_pct between 70 and 99),
  analysis text not null,
  result text not null default 'pending' check (result in ('win', 'loss', 'void', 'pending')),
  created_at timestamptz default now()
);

-- Índice para pesquisa por data
create index if not exists daily_picks_date_idx on daily_picks(date desc);

-- 3. Histórico pessoal de apostas dos utilizadores
create table if not exists user_bets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  pick_id uuid references daily_picks(id) on delete cascade not null,
  stake decimal(10,2),
  saved_at timestamptz default now(),
  unique(user_id, pick_id)
);

-- Índice para listagens do dashboard
create index if not exists user_bets_user_id_idx on user_bets(user_id);

-- 4. Estatísticas de tipsters (calculadas/atualizadas via função)
create table if not exists tipster_stats (
  user_id uuid references profiles(id) on delete cascade primary key,
  total_bets integer default 0,
  wins integer default 0,
  win_rate decimal(5,2) default 0,
  profit_loss decimal(10,2) default 0,
  updated_at timestamptz default now()
);

-- Função para recalcular estatísticas de um utilizador
create or replace function update_tipster_stats(p_user_id uuid)
returns void as $$
declare
  v_total integer;
  v_wins integer;
  v_win_rate decimal;
  v_profit decimal;
begin
  select
    count(*),
    count(*) filter (where dp.result = 'win'),
    coalesce(sum(
      case dp.result
        when 'win' then coalesce(ub.stake, 10) * (dp.odds - 1)
        when 'loss' then -coalesce(ub.stake, 10)
        else 0
      end
    ), 0)
  into v_total, v_wins, v_profit
  from user_bets ub
  join daily_picks dp on dp.id = ub.pick_id
  where ub.user_id = p_user_id
    and dp.result != 'pending';

  v_win_rate := case when v_total > 0 then round((v_wins::decimal / v_total) * 100, 2) else 0 end;

  insert into tipster_stats (user_id, total_bets, wins, win_rate, profit_loss, updated_at)
  values (p_user_id, v_total, v_wins, v_win_rate, v_profit, now())
  on conflict (user_id) do update set
    total_bets = excluded.total_bets,
    wins = excluded.wins,
    win_rate = excluded.win_rate,
    profit_loss = excluded.profit_loss,
    updated_at = excluded.updated_at;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles: todos leem, apenas o próprio edita
alter table profiles enable row level security;
create policy "Perfis públicos" on profiles for select using (true);
create policy "Utilizador edita o próprio perfil" on profiles for update using (auth.uid() = id);

-- Daily picks: todos os autenticados leem
alter table daily_picks enable row level security;
create policy "Apostas visíveis a autenticados" on daily_picks for select using (auth.role() = 'authenticated');
create policy "Apenas service role insere/atualiza picks" on daily_picks for all using (auth.role() = 'service_role');

-- User bets: cada utilizador vê apenas as suas
alter table user_bets enable row level security;
create policy "Utilizador vê as suas apostas" on user_bets for select using (auth.uid() = user_id);
create policy "Utilizador guarda apostas" on user_bets for insert with check (auth.uid() = user_id);
create policy "Utilizador apaga as suas apostas" on user_bets for delete using (auth.uid() = user_id);

-- Tipster stats: todos leem (ranking público)
alter table tipster_stats enable row level security;
create policy "Stats públicas" on tipster_stats for select using (true);
create policy "Apenas service role atualiza stats" on tipster_stats for all using (auth.role() = 'service_role');
