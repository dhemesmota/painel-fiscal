-- Empresas: um registro por usuário
create table if not exists empresas (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  razao_social         text,
  nome_fantasia        text,
  cnpj                 text,
  inscricao_municipal  text,
  municipio_incidencia text,
  aliquota_iss         numeric default 0,
  atividade            text,
  data_abertura        date,
  endereco             text,
  telefone             text,
  email                text,
  updated_at           timestamptz default now(),
  constraint empresas_user_id_unique unique (user_id)
);

-- Notas Fiscais
create table if not exists notas_fiscais (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mes          text not null,       -- 'YYYY-MM'
  data_emissao date not null,
  numero       text,
  tomador      text,
  valor        numeric not null,
  descricao    text,
  created_at   timestamptz default now()
);

-- Faturamento histórico (overrides manuais por mês)
create table if not exists faturamento_historico (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  mes        text not null,         -- 'YYYY-MM'
  valor      numeric not null,
  origem     text default 'manual',
  updated_at timestamptz default now(),
  constraint faturamento_historico_user_mes unique (user_id, mes)
);

-- Checklist mensal
create table if not exists checklist_mensal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  mes        text not null,         -- 'YYYY-MM'
  nf         boolean default false,
  pgdas      boolean default false,
  pago       boolean default false,
  updated_at timestamptz default now(),
  constraint checklist_mensal_user_mes unique (user_id, mes)
);

-- RLS
alter table empresas            enable row level security;
alter table notas_fiscais       enable row level security;
alter table faturamento_historico enable row level security;
alter table checklist_mensal    enable row level security;

-- Políticas (select/insert/update/delete restrito ao próprio usuário)
create policy "empresas_own" on empresas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notas_own" on notas_fiscais
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "historico_own" on faturamento_historico
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "checklist_own" on checklist_mensal
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
