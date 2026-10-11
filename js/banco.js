/* =====================================================================
   LIGAÇÃO COM O BANCO (Supabase). Fica num lugar só e é usada pelo
   login, pelo painel e pelo portfólio.
   Aqui só existe a chave PÚBLICA, que pode ficar visível sem problema.
   A segurança de verdade está nas regras do banco (veja banco.sql).
   NUNCA coloque aqui a chave secreta (service_role).
   ===================================================================== */
window.SUPABASE_URL = "https://qvrmqqckgdswumkyqlom.supabase.co";
window.SUPABASE_CHAVE = "sb_publishable_k9Nj5AukpCM6sx_HEFgeaQ_pab22hxC";

/* Só cria a conexão se a biblioteca do Supabase (CDN) carregou.
   Se não carregou (sem internet, bloqueio), window.db fica null e
   cada página trata isso sem quebrar. */
window.db = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_CHAVE)
  : null;
