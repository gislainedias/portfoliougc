-- =====================================================================
-- ABA ROTEIROS: biblioteca de transcrições + configurações (chave da Supadata)
--
-- ONDE COLAR: no Supabase, abra o seu projeto, clique em "SQL Editor",
-- "New query", cole TODO este arquivo e aperte "Run". Se aparecer
-- "Success", deu certo. Pode rodar de novo sem medo: não apaga nada.
--
-- Precisa ter rodado o banco.sql antes (ele cria a função eh_gislaine).
-- A tabela fica trancada: só você, logada com o seu e-mail, lê e escreve.
-- O público (anon) não enxerga nada.
-- =====================================================================

create table if not exists public.roteiros (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  fonte       text check (fonte in ('instagram','tiktok','youtube','manual')),
  url         text,
  perfil      text,
  de_quem     text not null default 'outra' check (de_quem in ('minha','outra')),
  titulo      text,
  transcricao text,
  legenda     text,
  postado_em  date,
  tags        text[] not null default '{}',
  obs         text,
  status      text not null default 'pronto' check (status in ('processando','pronto','falhou')),
  erro        text,
  segmentos   jsonb
);

create table if not exists public.configuracoes (
  chave       text primary key,
  valor       text,
  updated_at  timestamptz not null default now()
);

create index if not exists roteiros_created_at_idx on public.roteiros (created_at desc);

alter table public.roteiros      enable row level security;
alter table public.configuracoes enable row level security;

revoke all on public.roteiros, public.configuracoes from anon;
grant select, insert, update, delete on public.roteiros, public.configuracoes to authenticated;

drop policy if exists "dona total" on public.roteiros;
create policy "dona total" on public.roteiros
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.configuracoes;
create policy "dona total" on public.configuracoes
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

-- FIM. Se chegou aqui sem erro vermelho, está tudo pronto.
