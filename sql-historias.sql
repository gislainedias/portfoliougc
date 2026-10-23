-- =====================================================================
-- CAIXA DE HISTÓRIAS (aba do painel)
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- Pode rodar de novo sem medo: ele não apaga nada.
-- =====================================================================

create table if not exists public.historias (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  aconteceu   text not null,
  tipo        text not null default 'bastidor'
              check (tipo in ('fracasso','case','opiniao','virada','bastidor','inusitado')),
  aprendizado text,
  criado_em   timestamptz not null default now()
);

alter table public.historias enable row level security;

revoke all on public.historias from anon;
grant select, insert, update, delete on public.historias to authenticated;

drop policy if exists "dona total" on public.historias;
create policy "dona total" on public.historias
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());
