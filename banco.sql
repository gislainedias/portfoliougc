-- =====================================================================
-- BANCO DE DADOS DO PAINEL DA GISLAINE DIAS
--
-- ONDE COLAR: no Supabase, abra o seu projeto, clique em "SQL Editor"
-- no menu da esquerda, clique em "New query", cole TODO este arquivo
-- e aperte o botão verde "Run". Se aparecer "Success", deu certo.
-- Pode rodar de novo sem medo: ele não duplica nem apaga nada.
--
-- Linhas que começam com dois traços são só comentários, o banco ignora.
-- =====================================================================


-- ---------------------------------------------------------------------
-- BLOCO 1: quem é a dona do painel
-- Uma função pequena que responde "quem está logado é a Gislaine?".
-- Todas as trancas abaixo usam ela. Só o e-mail abaixo passa.
-- ---------------------------------------------------------------------
create or replace function public.eh_gislaine()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'gislainediasugc@gmail.com', false);
$$;


-- ---------------------------------------------------------------------
-- BLOCO 2: as tabelas
-- Toda tabela de lista tem a coluna "exemplo". Linha com exemplo = true
-- é só uma amostra do formato. Pode apagar quando quiser.
-- ---------------------------------------------------------------------

-- Vídeos do portfólio (o site lê esta tabela)
create table if not exists public.videos (
  id        bigint generated always as identity primary key,
  titulo    text not null,
  link      text,
  nicho     text,
  formato   text,
  marca     text,
  destaque  text,                       -- ex: 2,4M views
  ordem     integer not null default 0,
  visivel   boolean not null default true,
  exemplo   boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Base de contatos de empresas (o formulário do site grava aqui)
create table if not exists public.marcas (
  id             bigint generated always as identity primary key,
  nome           text not null,
  instagram      text,
  email          text,
  telefone       text,
  situacao       text not null default 'lead'
                 check (situacao in ('lead','conversando','cliente','parada')),
  obs            text,
  ultimo_contato date,
  exemplo        boolean not null default false,
  criado_em      timestamptz not null default now()
);

-- Calendário de gravar, editar e postar
create table if not exists public.calendario (
  id        bigint generated always as identity primary key,
  titulo    text not null,
  marca     text,
  tipo      text not null default 'gravar'
            check (tipo in ('gravar','editar','postar')),
  data      date not null,
  status    text not null default 'a fazer'
            check (status in ('a fazer','feito')),
  exemplo   boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Campanhas (trabalhos fechados com marcas)
create table if not exists public.campanhas (
  id        bigint generated always as identity primary key,
  campanha  text not null,
  cliente   text,
  tipo      text not null default 'Conteúdo'
            check (tipo in ('Conteúdo','Publicidade')),
  status    text not null default 'Briefing'
            check (status in ('Briefing','Roteiro','Aprovação Roteiro','Gravação','Edição','Aprovado','Entregue')),
  qtd       integer not null default 1,
  valor     numeric(12,2) not null default 0,
  prazo     date,
  pagamento text not null default 'pendente'
            check (pagamento in ('pendente','pago')),
  ativa     boolean not null default true,
  favorita  boolean not null default false,
  exemplo   boolean not null default false,
  criado_em timestamptz not null default now()
);

-- O que você já marcou nos checklists (guardado por uma chave de texto)
create table if not exists public.marcados (
  chave         text primary key,
  marcado       boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- Visitas do portfólio, para as métricas
create table if not exists public.visitas (
  id        bigint generated always as identity primary key,
  data      date not null default current_date,
  pagina    text,
  origem    text,
  criado_em timestamptz not null default now()
);

-- Ideias de roteiros (a sexta aba do painel)
create table if not exists public.ideias (
  id        bigint generated always as identity primary key,
  titulo    text not null,
  texto     text,
  nicho     text,
  status    text not null default 'ideia'
            check (status in ('ideia','roteirizando','gravado')),
  exemplo   boolean not null default false,
  criado_em timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- BLOCO 3: a tranca (RLS) ligada em TODAS as tabelas
-- Com o RLS ligado e nenhuma regra, ninguém lê nem escreve nada.
-- Só abrimos as portas que listamos nos blocos seguintes.
-- ---------------------------------------------------------------------
alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;
alter table public.ideias     enable row level security;


-- ---------------------------------------------------------------------
-- BLOCO 4: permissões básicas (cinto e suspensório)
-- Tira tudo de quem está deslogado e devolve só o estritamente preciso.
-- Isso vale ALÉM das regras de RLS: duas trancas em vez de uma.
-- ---------------------------------------------------------------------
revoke all on public.videos, public.marcas, public.calendario,
              public.campanhas, public.marcados, public.visitas,
              public.ideias from anon;

grant select on public.videos to anon;   -- o site precisa mostrar os vídeos
grant insert on public.marcas to anon;   -- formulário de contato
grant insert on public.visitas to anon;  -- registro de visita

-- Você logada precisa de acesso total (as regras abaixo filtram quem é você)
grant select, insert, update, delete on
  public.videos, public.marcas, public.calendario, public.campanhas,
  public.marcados, public.visitas, public.ideias to authenticated;


-- ---------------------------------------------------------------------
-- BLOCO 5: regras da dona
-- Só o usuário logado com o seu e-mail lê e escreve tudo.
-- Se alguém criar outra conta no seu Supabase, essa conta NÃO passa.
-- ---------------------------------------------------------------------
drop policy if exists "dona total" on public.videos;
create policy "dona total" on public.videos
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.marcas;
create policy "dona total" on public.marcas
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.calendario;
create policy "dona total" on public.calendario
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.campanhas;
create policy "dona total" on public.campanhas
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.marcados;
create policy "dona total" on public.marcados
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.visitas;
create policy "dona total" on public.visitas
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());

drop policy if exists "dona total" on public.ideias;
create policy "dona total" on public.ideias
  for all to authenticated
  using (public.eh_gislaine()) with check (public.eh_gislaine());


-- ---------------------------------------------------------------------
-- BLOCO 6: as portas abertas para o público (só estas três)
-- ---------------------------------------------------------------------

-- 6a) Qualquer pessoa pode ENVIAR um contato pelo formulário do site.
--     Só entra como "lead" e nunca como exemplo. Ninguém consegue LER.
drop policy if exists "publico envia contato" on public.marcas;
create policy "publico envia contato" on public.marcas
  for insert to anon
  with check (
    situacao = 'lead'
    and exemplo = false
    and char_length(nome) between 1 and 200
    and char_length(coalesce(obs, '')) <= 3000
  );

-- 6b) Qualquer pessoa pode REGISTRAR uma visita. Ninguém consegue LER.
drop policy if exists "publico registra visita" on public.visitas;
create policy "publico registra visita" on public.visitas
  for insert to anon
  with check (
    char_length(coalesce(pagina, '')) <= 300
    and char_length(coalesce(origem, '')) <= 300
  );

-- 6c) EXCEÇÃO NECESSÁRIA: o portfólio precisa LER os vídeos para exibir.
--     Só enxerga vídeo marcado como visível e que não seja exemplo.
--     Vídeo escondido (olhinho fechado) continua invisível para o público.
drop policy if exists "publico le videos visiveis" on public.videos;
create policy "publico le videos visiveis" on public.videos
  for select to anon
  using (visivel = true and exemplo = false);


-- ---------------------------------------------------------------------
-- BLOCO 7: uma linha de exemplo em cada lista
-- Só para você entender o formato. Pode apagar pelo painel.
-- Nomes inventados e sem marca conhecida. Só entram se a lista estiver vazia.
-- ---------------------------------------------------------------------
insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem, visivel, exemplo)
select 'EXEMPLO: apague depois', 'https://youtube.com/shorts/XXXXXXXXXXX', 'casa', 'Reels', 'Marca Exemplo', '0 views', 1, false, true
where not exists (select 1 from public.videos);

insert into public.marcas (nome, instagram, email, telefone, situacao, obs, ultimo_contato, exemplo)
select 'EXEMPLO: Marca Modelo', '@marcamodelo', 'contato@marcamodelo.com', '44999999999', 'lead', 'Linha de exemplo, pode apagar.', current_date, true
where not exists (select 1 from public.marcas);

insert into public.calendario (titulo, marca, tipo, data, status, exemplo)
select 'EXEMPLO: gravar vídeo', 'Marca Modelo', 'gravar', current_date, 'a fazer', true
where not exists (select 1 from public.calendario);

insert into public.campanhas (campanha, cliente, tipo, status, qtd, valor, prazo, pagamento, ativa, favorita, exemplo)
select 'EXEMPLO: campanha modelo', 'Marca Modelo', 'Conteúdo', 'Briefing', 1, 0, current_date + 7, 'pendente', true, false, true
where not exists (select 1 from public.campanhas);

insert into public.ideias (titulo, texto, nicho, status, exemplo)
select 'EXEMPLO: ideia de roteiro', 'Escreva aqui o gancho e os pontos principais do vídeo.', 'casa', 'ideia', true
where not exists (select 1 from public.ideias);

-- FIM. Se chegou aqui sem erro vermelho, está tudo pronto.
