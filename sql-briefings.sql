-- =====================================================================
-- ARQUIVOS DE BRIEFING (aba Ficha de triagem > Briefing da campanha)
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- Cria uma pasta privada (bucket) "briefings" onde só você lê e grava.
-- Pode rodar de novo sem medo: ele não apaga nada.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('briefings', 'briefings', false)
on conflict (id) do nothing;

drop policy if exists "dona briefings" on storage.objects;
create policy "dona briefings" on storage.objects
  for all to authenticated
  using (bucket_id = 'briefings' and public.eh_gislaine())
  with check (bucket_id = 'briefings' and public.eh_gislaine());
