-- =====================================================================
-- OPCIONAL: traz para o painel os vídeos que já estão no seu portfólio.
--
-- POR QUE EXISTE: assim que você tiver UM vídeo visível na tabela
-- "videos", o site passa a mostrar só o que está na tabela. Rode este
-- arquivo para os seus vídeos atuais não sumirem do site.
--
-- QUANDO RODAR: depois do banco.sql, uma vez só. No Supabase: SQL Editor,
-- New query, cole tudo e clique em Run. Se rodar duas vezes, ele não
-- duplica (só insere se a tabela ainda não tiver estes vídeos).
-- =====================================================================

insert into public.videos (titulo, link, nicho, ordem, visivel)
select v.titulo, 'https://youtube.com/shorts/' || v.id, v.nicho, v.ordem, true
from (values
  ('App Moshi Cam', 'kBlY3xtX94g', 'tech', 1),
  ('App Dola', 'aUHYWgehZog', 'tech', 2),
  ('Site de música personalizada', '15FNTP0pWz0', 'tech', 3),
  ('App My All', 'zOr4TN2z0Ro', 'tech', 4),
  ('App Elevenlabs', 'QVqnXFI-BDQ', 'tech', 5),
  ('Maquiagem barata na Shopee', 'cXZtHrNhmBc', 'tech', 6),
  ('Compras na Shopee', 'ZnrLUMW4f0c', 'tech', 7),
  ('Agência de viagens', 'xy-JqfQb0Zg', 'tech', 8),
  ('Ads para agência de viagens', 'a4EcRNqCqX0', 'tech', 9),
  ('Rotina de limpeza - Condor', 'UJ-tmN2JG7U', 'casa', 10),
  ('Mesa para notebook - Shopee', 'H9gcKBocwVk', 'casa', 11),
  ('Compras para casa', 'ZnrLUMW4f0c', 'casa', 12),
  ('Cif Limpeza Milagrosa', 'nLxJLM_b4bA', 'casa', 13),
  ('Mop Autotorção', '-g_QYjpNeD8', 'casa', 14),
  ('Lip Combo - Love Rain', 'GPRa7I_S27E', 'maquiagem', 15),
  ('Maquiagem barata na Shopee', 'cXZtHrNhmBc', 'maquiagem', 16),
  ('Blush Love Rain', 'LxWZzMeWbjQ', 'maquiagem', 17),
  ('Rímel', 'sYlJj7Et69M', 'maquiagem', 18),
  ('Batom Matte Sace Lady', 'rc1w6u109d8', 'maquiagem', 19),
  ('Esfoliante Corporal', 'L27_u7gNY-g', 'autocuidado', 20),
  ('Vitaxonn - Vitamina C', 'ZaXOyj8mPeE', 'autocuidado', 21),
  ('Topo de funil', 'cfqwSytiiu8', 'perfumaria', 22),
  ('Apresentação de perfume', '1sVGBVopSvk', 'perfumaria', 23),
  ('Skintone - antimanchas', '7vin4BpjIuo', 'skincare', 24),
  ('Spicule PDRN - Yesstyle', 'R72Ra8-g0aA', 'skincare', 25),
  ('Simple Organic - PDRN', 'IECKVkFnUQw', 'skincare', 26),
  ('Sérum Pantene Bambu', '9ocZkAq158g', 'cabelo', 27),
  ('DKA Força Bruta', 'lnK2Qjk7hU0', 'cabelo', 28),
  ('Unboxing Eudora', 'xtfPfcx6BQ4', 'cabelo', 29),
  ('Ultra Bond Reset', '1QkieqtJm7M', 'cabelo', 30),
  ('Óculos Saint Germain', 'U-D5_LTn5w0', 'moda', 31),
  ('Macacão Use By Me', 'NcOA6RIqp6k', 'moda', 32)
) as v(titulo, id, nicho, ordem)
where not exists (
  select 1 from public.videos x where x.link = 'https://youtube.com/shorts/' || v.id and x.nicho = v.nicho
);

-- A linha de exemplo do banco.sql fica escondida do site. Pode apagar no painel.
