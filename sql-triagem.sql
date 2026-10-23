-- =====================================================================
-- FICHA DE TRIAGEM (aba do painel)
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- Pode rodar de novo sem medo: ele não apaga nada.
-- =====================================================================

create table if not exists public.fichas_triagem (
  id            bigint generated always as identity primary key,
  marca         text not null,
  dados         jsonb not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.fichas_triagem enable row level security;

revoke all on public.fichas_triagem from anon;
grant select, insert, update, delete on public.fichas_triagem to authenticated;

drop policy if exists "dona total" on public.fichas_triagem;
create policy "dona total" on public.fichas_triagem
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());
