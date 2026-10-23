-- =====================================================================
-- CADERNO DE PAUTAS (aba do painel)
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- Pode rodar de novo sem medo: ele não apaga nada.
-- =====================================================================

create table if not exists public.pautas (
  id        bigint generated always as identity primary key,
  titulo    text not null,
  editoria  text not null default 'exp'
            check (editoria in ('exp','desc','crio','bf')),
  etapa     text not null default 'T'
            check (etapa in ('T','M','F')),
  formato   text,
  ganho     text,
  cta       text,
  obs       text,
  especial  boolean not null default false,
  data      date,
  criado_em timestamptz not null default now()
);

alter table public.pautas enable row level security;

revoke all on public.pautas from anon;
grant select, insert, update, delete on public.pautas to authenticated;

drop policy if exists "dona total" on public.pautas;
create policy "dona total" on public.pautas
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());
