/* =====================================================================
   PAINEL DA GISLAINE DIAS
   A PRIMEIRA coisa que acontece aqui é conferir se existe sessão aberta.
   Sem sessão, vai para o login. O painel só aparece depois disso.
   ===================================================================== */
(function () {
  "use strict";

  var db = window.db;

  /* ------------------------ 1. CONFERIR A SESSÃO ------------------------ */
  function paraLogin() { location.replace("../login/"); }

  function mostrarFalhaInicial(texto) {
    var t = document.getElementById("carregandoTxt");
    if (t) t.textContent = texto;
  }

  if (!db) {
    mostrarFalhaInicial("Não consegui carregar a conexão com o banco. Confira a internet e recarregue a página.");
    return;
  }

  db.auth.getSession().then(function (r) {
    var sessao = r && r.data && r.data.session;
    if (!sessao) { paraLogin(); return; }
    return db.auth.getUser().then(function (u) {
      /* Se o servidor disser que a sessão não vale mais, volta pro login.
         Se só estiver sem internet, deixa abrir (o banco recusa o que não puder). */
      if (u && u.error && (u.error.status === 401 || u.error.status === 403)) {
        return db.auth.signOut().then(paraLogin, paraLogin);
      }
      iniciar(sessao);
    }, function () { iniciar(sessao); });
  }, function () { paraLogin(); });

  /* ------------------------ 2. PEQUENAS FERRAMENTAS ------------------------ */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* Deixa passar só <b> e <em> (a biblioteca usa isso nos roteiros) */
  function htmlSeguro(s) { return esc(s).replace(/&lt;(\/?)(b|em)&gt;/g, "<$1$2>"); }
  function num(x) { var n = Number(x); return isFinite(n) ? n : 0; }
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate()); }
  function hojeISO() { return iso(new Date()); }
  function paraData(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function diasEntre(a, b) { /* b menos a, em dias */
    var A = paraData(a), B = paraData(b);
    return Math.round((Date.UTC(B.getFullYear(), B.getMonth(), B.getDate()) - Date.UTC(A.getFullYear(), A.getMonth(), A.getDate())) / 86400000);
  }
  function somarDias(s, n) { var d = paraData(s); d.setDate(d.getDate() + n); return iso(d); }
  function dataBR(s) { if (!s) return ""; var p = String(s).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s; }
  function dataCurta(s) { var p = String(s).split("-"); return p[2] + "/" + p[1]; }
  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function moeda(n) { return BRL.format(num(n)); }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }
  function cmpTexto(a, b) { return String(a || "").localeCompare(String(b || ""), "pt-BR", { sensitivity: "base" }); }

  var toastTimer = null;
  function toast(msg, erro) {
    var t = $("#toast");
    t.textContent = msg; t.className = "toast" + (erro ? " erro" : ""); t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, erro ? 6000 : 2600);
  }

  var ICON = {
    editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    lixo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    olho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    olhoOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 004.1-.9M9.9 9.9a3 3 0 004.2 4.2"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    alca: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12z"/></svg>',
    estrela: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" stroke-linejoin="round"/></svg>',
    seta: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    esq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    dir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
  };

  /* Nichos do site (os mesmos ids do index.html) */
  var NICHOS_SITE = [
    ["tech", "Tech & Apps"], ["casa", "Casa"], ["maquiagem", "Maquiagem"], ["autocuidado", "Autocuidado"],
    ["perfumaria", "Perfumaria"], ["skincare", "Skincare"], ["cabelo", "Cabelo"], ["moda", "Moda e Acessórios"]
  ];
  function nomeNicho(id) {
    for (var i = 0; i < NICHOS_SITE.length; i++) if (NICHOS_SITE[i][0] === id) return NICHOS_SITE[i][1];
    return id || "";
  }
  var SITUACOES = [["lead", "Lead"], ["conversando", "Conversando"], ["cliente", "Cliente"], ["parada", "Parada"]];
  var FUNIL = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];
  var TIPOS_CAMP = ["Conteúdo", "Publicidade"];
  var TIPOS_CAL = [["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"]];
  function rotuloSit(v) { for (var i = 0; i < SITUACOES.length; i++) if (SITUACOES[i][0] === v) return SITUACOES[i][1]; return v || ""; }
  function rotuloTipoCal(v) { for (var i = 0; i < TIPOS_CAL.length; i++) if (TIPOS_CAL[i][0] === v) return TIPOS_CAL[i][1]; return v || ""; }

  /* ------------------------ 3. DADOS E AVISOS ------------------------ */
  var S = { videos: [], marcas: [], calendario: [], campanhas: [], ideias: [], visitas: [], marcados: {} };
  var faltas = {}; /* tabela -> texto do aviso */

  function erroAmigavel(tabela, e) {
    var m = (e && e.message) || "", c = (e && e.code) || "";
    if (c === "PGRST205" || c === "42P01") return "A tabela “" + tabela + "” ainda não existe no seu Supabase. Rode o arquivo banco.sql.";
    if (c === "PGRST204" || c === "42703" || /column/i.test(m)) {
      var mm = m.match(/'([^']+)' column/) || m.match(/column "?([a-z_]+)"?/i);
      return "Falta o campo " + (mm ? "“" + mm[1] + "” " : "") + "na tabela “" + tabela + "”. Rode de novo o arquivo banco.sql.";
    }
    if (c === "42501" || /row-level|permission denied/i.test(m)) return "O banco não deixou acessar “" + tabela + "”. Confira se você entrou com o seu e-mail e se o banco.sql foi rodado.";
    if (c === "23514") return "Algum valor escolhido não é aceito pelo banco. Confira as opções.";
    if (/fetch|network/i.test(m)) return "Sem conexão com o banco agora. Confira a internet.";
    return "Problema na tabela “" + tabela + "”: " + m;
  }

  function carregarTabela(t) {
    return db.from(t).select("*").then(function (r) {
      if (r.error) { faltas[t] = erroAmigavel(t, r.error); S[t] = []; }
      else { delete faltas[t]; S[t] = r.data || []; }
    }, function (e) { faltas[t] = erroAmigavel(t, e); S[t] = []; });
  }

  function carregarMarcados() {
    return db.from("marcados").select("chave,marcado").then(function (r) {
      S.marcados = {};
      if (r.error) { faltas.marcados = erroAmigavel("marcados", r.error); return; }
      delete faltas.marcados;
      (r.data || []).forEach(function (x) { S.marcados[x.chave] = x.marcado === true; });
    }, function (e) { faltas.marcados = erroAmigavel("marcados", e); });
  }

  /* Visitas dos últimos 14 dias, buscando de mil em mil (o banco entrega no máximo mil por vez) */
  function carregarVisitas() {
    var desde = somarDias(hojeISO(), -13), acumulado = [];
    function pagina(de) {
      return db.from("visitas").select("data,origem,pagina").gte("data", desde).range(de, de + 999).then(function (r) {
        if (r.error) { faltas.visitas = erroAmigavel("visitas", r.error); S.visitas = []; return; }
        acumulado = acumulado.concat(r.data || []);
        if ((r.data || []).length === 1000 && de < 49000) return pagina(de + 1000);
        delete faltas.visitas; S.visitas = acumulado;
      }, function (e) { faltas.visitas = erroAmigavel("visitas", e); S.visitas = []; });
    }
    return pagina(0);
  }

  function carregarTudo() {
    return Promise.all([
      carregarTabela("videos"), carregarTabela("marcas"), carregarTabela("calendario"),
      carregarTabela("campanhas"), carregarTabela("ideias"), carregarMarcados(), carregarVisitas()
    ]);
  }

  function desenharAvisos() {
    var el = $("#avisos"), html = "";
    Object.keys(faltas).forEach(function (k) { html += '<div class="faixa aviso">' + esc(faltas[k]) + "</div>"; });
    if (!window.Biblioteca) html += '<div class="faixa aviso">O arquivo js/biblioteca.js não carregou. A aba Checklist fica sem o conteúdo de consulta.</div>';
    el.innerHTML = html;
  }

  function gravar(tabela, id, obj) {
    var q = id ? db.from(tabela).update(obj).eq("id", id) : db.from(tabela).insert(obj);
    return q.select().single().then(function (r) {
      if (r.error) { toast(erroAmigavel(tabela, r.error), true); return null; }
      var lista = S[tabela];
      if (id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) { lista[i] = r.data; break; } }
      else lista.push(r.data);
      return r.data;
    }, function (e) { toast(erroAmigavel(tabela, e), true); return null; });
  }
  function apagar(tabela, id) {
    return db.from(tabela).delete().eq("id", id).then(function (r) {
      if (r.error) { toast(erroAmigavel(tabela, r.error), true); return false; }
      S[tabela] = S[tabela].filter(function (x) { return x.id !== id; });
      return true;
    }, function (e) { toast(erroAmigavel(tabela, e), true); return false; });
  }
  function achar(tabela, id) {
    for (var i = 0; i < S[tabela].length; i++) if (String(S[tabela][i].id) === String(id)) return S[tabela][i];
    return null;
  }

  /* ------------------------ 4. JANELAS ------------------------ */
  var dlg;
  function abrirJanela(html, larga) {
    dlg.className = larga ? "larga" : "";
    dlg.innerHTML = '<div class="dlg">' + html + "</div>";
    if (!dlg.open) dlg.showModal();
  }
  function fecharJanela() { if (dlg.open) dlg.close(); }

  function confirmar(texto, botao) {
    return new Promise(function (resolve) {
      var d = document.createElement("dialog");
      d.innerHTML = '<div class="dlg"><h2>Tem certeza?</h2><p style="margin-bottom:14px">' + esc(texto) + '</p>' +
        '<div class="dlg-rod"><button class="btn btn-ghost" type="button" data-n>Cancelar</button>' +
        '<button class="btn btn-main" type="button" data-s>' + esc(botao || "Apagar") + "</button></div></div>";
      document.body.appendChild(d);
      function fim(v) { d.close(); d.remove(); resolve(v); }
      d.querySelector("[data-n]").addEventListener("click", function () { fim(false); });
      d.querySelector("[data-s]").addEventListener("click", function () { fim(true); });
      d.addEventListener("cancel", function () { setTimeout(function () { d.remove(); resolve(false); }, 0); });
      d.showModal();
    });
  }

  /* Formulário genérico. campos: {k, r, t, op, req, dica, m} */
  function formulario(cfg) {
    var html = "<h2>" + esc(cfg.titulo) + "</h2><form id=\"formGen\" novalidate>", grupo = [];
    function campo(c) {
      var v = cfg.valores && cfg.valores[c.k] != null ? cfg.valores[c.k] : (c.padrao != null ? c.padrao : "");
      var id = "f_" + c.k, h = "";
      if (c.t === "check") {
        return '<div class="field check"><input type="checkbox" id="' + id + '"' + (v === true ? " checked" : "") + '><label for="' + id + '">' + esc(c.r) + "</label></div>";
      }
      h += '<div class="field"><label for="' + id + '">' + esc(c.r) + (c.req ? " *" : "") + "</label>";
      if (c.t === "select") {
        h += '<select id="' + id + '">';
        c.op.forEach(function (o) {
          var val = Array.isArray(o) ? o[0] : o, rot = Array.isArray(o) ? o[1] : o;
          h += '<option value="' + esc(val) + '"' + (String(val) === String(v) ? " selected" : "") + ">" + esc(rot) + "</option>";
        });
        h += "</select>";
      } else if (c.t === "textarea") {
        h += '<textarea id="' + id + '">' + esc(v) + "</textarea>";
      } else {
        h += '<input id="' + id + '" type="' + (c.t || "text") + '"' + (c.t === "number" ? ' step="' + (c.passo || "1") + '" min="0"' : "") + ' value="' + esc(v) + '"' + (c.ph ? ' placeholder="' + esc(c.ph) + '"' : "") + ">";
      }
      if (c.dica) h += '<div class="dica">' + esc(c.dica) + "</div>";
      return h + "</div>";
    }
    function soltarGrupo() {
      if (!grupo.length) return;
      html += '<div class="linha2">' + grupo.join("") + "</div>"; grupo = [];
    }
    cfg.campos.forEach(function (c) {
      if (c.m) { grupo.push(campo(c)); if (grupo.length === 2) soltarGrupo(); }
      else { soltarGrupo(); html += campo(c); }
    });
    soltarGrupo();
    html += '<p class="faixa erro" id="formErro" hidden></p><div class="dlg-rod">';
    if (cfg.onApagar) html += '<button class="btn btn-ghost esq" type="button" id="btnApagarForm">Apagar</button>';
    html += '<button class="btn btn-ghost" type="button" id="btnCancelarForm">Cancelar</button>' +
      '<button class="btn btn-main" type="submit">' + esc(cfg.salvar || "Salvar") + "</button></div></form>";
    abrirJanela(html);

    var form = $("#formGen", dlg);
    function ler() {
      var o = {};
      cfg.campos.forEach(function (c) {
        var el = $("#f_" + c.k, dlg);
        if (c.t === "check") o[c.k] = el.checked;
        else if (c.t === "number") o[c.k] = el.value === "" ? 0 : Number(el.value);
        else if (c.t === "date") o[c.k] = el.value || null;
        else o[c.k] = el.value.trim();
      });
      return o;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var o = ler(), er = $("#formErro", dlg);
      for (var i = 0; i < cfg.campos.length; i++) {
        var c = cfg.campos[i];
        if (c.req && (o[c.k] === "" || o[c.k] == null)) { er.textContent = "Preencha: " + c.r; er.hidden = false; return; }
      }
      er.hidden = true;
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      Promise.resolve(cfg.onSalvar(o)).then(function (ok) {
        if (ok) fecharJanela(); else btn.disabled = false;
      });
    });
    $("#btnCancelarForm", dlg).addEventListener("click", fecharJanela);
    if (cfg.onApagar) $("#btnApagarForm", dlg).addEventListener("click", function () {
      confirmar(cfg.msgApagar || "Apagar este item?").then(function (s) {
        if (!s) return;
        Promise.resolve(cfg.onApagar()).then(function (ok) { if (ok) fecharJanela(); });
      });
    });
    var primeiro = form.querySelector("input,select,textarea"); if (primeiro) primeiro.focus();
  }

  function baixarCSV(nome, linhas) {
    var txt = linhas.map(function (l) {
      return l.map(function (c) {
        var s = String(c == null ? "" : c);
        return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(";");
    }).join("\r\n");
    /* BOM no começo + separador ponto e vírgula: o Excel em português abre certinho, com acento */
    var blob = new Blob(["﻿" + txt], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function cab(titulo, sub, acoes) {
    return '<div class="cab"><div><h1>' + esc(titulo) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>" +
      (acoes ? '<div class="acoes">' + acoes + "</div>" : "") + "</div>";
  }
  function exTag(r) { return r.exemplo === true ? '<span class="ex-tag">exemplo</span>' : ""; }
  function reais(lista) { return lista.filter(function (r) { return r.exemplo !== true; }); }

  /* ------------------------ 5. ABA PORTFÓLIO ------------------------ */
  function videosOrdenados() {
    return S.videos.slice().sort(function (a, b) { return (num(a.ordem) - num(b.ordem)) || (num(a.id) - num(b.id)); });
  }

  function renderPortfolio() {
    var hoje = hojeISO(), dias = [], contagem = {}, i;
    for (i = 13; i >= 0; i--) { var d = somarDias(hoje, -i); dias.push(d); contagem[d] = 0; }
    var origens = {}, total14 = 0;
    S.visitas.forEach(function (v) {
      var d = String(v.data || "").slice(0, 10);
      if (contagem[d] == null) return;
      contagem[d]++; total14++;
      var o = (v.origem || "direto").toString().trim() || "direto";
      origens[o] = (origens[o] || 0) + 1;
    });
    var noAr = reais(S.videos).filter(function (v) { return v.visivel !== false; });
    var porNicho = {};
    noAr.forEach(function (v) { if (v.nicho) porNicho[v.nicho] = (porNicho[v.nicho] || 0) + 1; });
    var topNicho = Object.keys(porNicho).sort(function (a, b) { return porNicho[b] - porNicho[a]; })[0];
    var listaOrig = Object.keys(origens).sort(function (a, b) { return origens[b] - origens[a]; });

    var h = cab("Portfólio", "Visitas do seu site e os vídeos que aparecem nele.", "");
    h += '<div class="strip">' +
      "<div><small>Visitas em 14 dias</small><b>" + total14 + "</b></div>" +
      "<div><small>Visitas hoje</small><b>" + contagem[hoje] + "</b></div>" +
      "<div><small>Vídeos no ar</small><b>" + noAr.length + "</b></div>" +
      "<div><small>Nicho mais forte</small><b>" + esc(topNicho ? nomeNicho(topNicho) : "Nenhum ainda") + "</b>" + (topNicho ? "<em>" + plural(porNicho[topNicho], "vídeo", "vídeos") + "</em>" : "") + "</div>" +
      "<div><small>De onde mais vêm</small><b>" + esc(listaOrig.length ? listaOrig[0] : "Nenhuma ainda") + "</b>" + (listaOrig.length ? "<em>" + plural(origens[listaOrig[0]], "visita", "visitas") + "</em>" : "") + "</div>" +
      "</div>";

    h += '<div class="duas"><section class="card"><h2>Visitas nos últimos 14 dias</h2>';
    if (total14 === 0) {
      h += '<div class="vazio">Aqui vai aparecer um gráfico de barras com as visitas de cada dia, assim que as primeiras pessoas começarem a visitar o seu portfólio.</div>';
    } else {
      var max = 1;
      dias.forEach(function (d) { if (contagem[d] > max) max = contagem[d]; });
      h += '<div class="grafico">';
      dias.forEach(function (d) {
        var n = contagem[d], alt = Math.round((n / max) * 100);
        h += '<div class="barra" title="' + dataBR(d) + ": " + n + '">' + (n ? "<b>" + n + "</b>" : "") +
          '<i class="' + (n ? "" : "zero") + '" style="height:' + (n ? Math.max(alt, 4) : 2) + '%"></i><span>' + dataCurta(d).slice(0, 2) + "</span></div>";
      });
      h += "</div>";
    }
    h += '</section><section class="card"><h2>Por onde chegaram</h2>';
    if (!listaOrig.length) {
      h += '<div class="vazio">Quando alguém visitar, aqui aparece de onde veio: Instagram, Google, link direto e outros.</div>';
    } else {
      h += '<ul class="origens">';
      listaOrig.slice(0, 8).forEach(function (o) {
        var pct = total14 > 0 ? Math.round((origens[o] * 100) / total14) : 0;
        h += '<li><span class="nome">' + esc(o) + '</span><span class="n">' + origens[o] + '</span><span class="p">' + pct + "%</span></li>";
      });
      h += "</ul>";
    }
    h += "</section></div>";

    h += '<div class="cab"><div><h2 style="font-size:15px;color:var(--vinho)">Meus vídeos</h2><p>Arraste pela alça para mudar a ordem. O olho mostra ou esconde do site.</p></div>' +
      '<div class="acoes"><button class="btn" data-acao="video-importar" type="button">Importar vídeos do site</button><button class="btn btn-main" data-acao="video-novo" type="button">' + ICON.mais + "Adicionar vídeo</button></div></div>";
    h += '<div class="tabela-wrap"><table><thead><tr><th style="width:56px"></th><th style="width:44px"></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th></th></tr></thead><tbody id="tbVideos"></tbody></table></div>';
    $("#aba").innerHTML = h;
    desenharVideos();
  }

  function desenharVideos() {
    var tb = $("#tbVideos"); if (!tb) return;
    var lista = videosOrdenados();
    if (!lista.length) { tb.innerHTML = '<tr><td colspan="8"><div class="vazio">Nenhum vídeo ainda. Clique em “Importar vídeos do site” para trazer os que já estão no portfólio, ou em Adicionar vídeo.</div></td></tr>'; return; }
    tb.innerHTML = lista.map(function (v, i) {
      var visivel = v.visivel !== false;
      return '<tr data-id="' + esc(v.id) + '" class="' + (visivel ? "" : "escondido") + '">' +
        '<td><span class="alca" data-alca title="Arraste para mudar a ordem">' + ICON.alca + "</span>" +
        '<span class="mover"><button type="button" data-acao="video-sobe" data-id="' + esc(v.id) + '" aria-label="Subir"' + (i === 0 ? " disabled" : "") + '>▲</button><button type="button" data-acao="video-desce" data-id="' + esc(v.id) + '" aria-label="Descer"' + (i === lista.length - 1 ? " disabled" : "") + ">▼</button></span></td>" +
        '<td><button class="icon-btn" type="button" data-acao="video-olho" data-id="' + esc(v.id) + '" aria-label="' + (visivel ? "Esconder do site" : "Mostrar no site") + '" title="' + (visivel ? "Visível no site" : "Escondido do site") + '">' + (visivel ? ICON.olho : ICON.olhoOff) + "</button></td>" +
        "<td>" + (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener noreferrer">' + esc(v.titulo) + "</a>" : esc(v.titulo)) + exTag(v) + "</td>" +
        "<td>" + esc(nomeNicho(v.nicho)) + "</td><td>" + esc(v.formato) + "</td><td>" + esc(v.marca) + "</td><td>" + esc(v.destaque) + "</td>" +
        '<td class="acoes-c"><button class="icon-btn" type="button" data-acao="video-editar" data-id="' + esc(v.id) + '" aria-label="Editar">' + ICON.editar + "</button>" +
        '<button class="icon-btn perigo" type="button" data-acao="video-apagar" data-id="' + esc(v.id) + '" aria-label="Apagar">' + ICON.lixo + "</button></td></tr>";
    }).join("");
  }

  function formVideo(v) {
    formulario({
      titulo: v ? "Editar vídeo" : "Adicionar vídeo",
      valores: v || {},
      campos: [
        { k: "titulo", r: "Título", req: true },
        { k: "link", r: "Link do vídeo (YouTube)", ph: "https://youtube.com/shorts/...", dica: "Cole o link do Shorts ou do vídeo. O site usa ele para tocar e mostrar a capa." },
        { k: "nicho", r: "Nicho", t: "select", op: [["", "Escolha um nicho"]].concat(NICHOS_SITE), m: true },
        { k: "formato", r: "Formato", m: true, ph: "Reels, Ads, orgânico..." },
        { k: "marca", r: "Marca", m: true },
        { k: "destaque", r: "Destaque", m: true, ph: "2,4M views" },
        { k: "visivel", r: "Mostrar no site", t: "check", padrao: true }
      ],
      onSalvar: function (o) {
        if (!v) { var max = 0; S.videos.forEach(function (x) { if (num(x.ordem) > max) max = num(x.ordem); }); o.ordem = max + 1; }
        return gravar("videos", v ? v.id : null, o).then(function (r) { if (r) { toast("Vídeo salvo"); desenharVideos(); atualizarTopoPortfolio(); } return !!r; });
      },
      onApagar: v ? function () {
        return apagar("videos", v.id).then(function (ok) { if (ok) { toast("Vídeo apagado"); renderPortfolio(); } return ok; });
      } : null,
      msgApagar: "Apagar este vídeo? Ele some do painel e do site."
    });
  }
  /* Os vídeos que já estão no portfólio (mesma lista fixa do index.html). */
  var VIDEOS_SITE = [
    ["App Moshi Cam", "kBlY3xtX94g", "tech"], ["App Dola", "aUHYWgehZog", "tech"],
    ["Site de música personalizada", "15FNTP0pWz0", "tech"], ["App My All", "zOr4TN2z0Ro", "tech"],
    ["App Elevenlabs", "QVqnXFI-BDQ", "tech"], ["Maquiagem barata na Shopee", "cXZtHrNhmBc", "tech"],
    ["Compras na Shopee", "ZnrLUMW4f0c", "tech"], ["Agência de viagens", "xy-JqfQb0Zg", "tech"],
    ["Ads para agência de viagens", "a4EcRNqCqX0", "tech"], ["Rotina de limpeza - Condor", "UJ-tmN2JG7U", "casa"],
    ["Mesa para notebook - Shopee", "H9gcKBocwVk", "casa"], ["Compras para casa", "ZnrLUMW4f0c", "casa"],
    ["Cif Limpeza Milagrosa", "nLxJLM_b4bA", "casa"], ["Mop Autotorção", "-g_QYjpNeD8", "casa"],
    ["Lip Combo - Love Rain", "GPRa7I_S27E", "maquiagem"], ["Maquiagem barata na Shopee", "cXZtHrNhmBc", "maquiagem"],
    ["Blush Love Rain", "LxWZzMeWbjQ", "maquiagem"], ["Rímel", "sYlJj7Et69M", "maquiagem"],
    ["Batom Matte Sace Lady", "rc1w6u109d8", "maquiagem"], ["Esfoliante Corporal", "L27_u7gNY-g", "autocuidado"],
    ["Vitaxonn - Vitamina C", "ZaXOyj8mPeE", "autocuidado"], ["Topo de funil", "cfqwSytiiu8", "perfumaria"],
    ["Apresentação de perfume", "1sVGBVopSvk", "perfumaria"], ["Skintone - antimanchas", "7vin4BpjIuo", "skincare"],
    ["Spicule PDRN - Yesstyle", "R72Ra8-g0aA", "skincare"], ["Simple Organic - PDRN", "IECKVkFnUQw", "skincare"],
    ["Sérum Pantene Bambu", "9ocZkAq158g", "cabelo"], ["DKA Força Bruta", "lnK2Qjk7hU0", "cabelo"],
    ["Unboxing Eudora", "xtfPfcx6BQ4", "cabelo"], ["Ultra Bond Reset", "1QkieqtJm7M", "cabelo"],
    ["Óculos Saint Germain", "U-D5_LTn5w0", "moda"], ["Macacão Use By Me", "NcOA6RIqp6k", "moda"]
  ];

  /* Traz para a tabela os vídeos do site que ainda não estão nela. Não duplica. */
  function importarVideosDoSite() {
    var base = 0;
    S.videos.forEach(function (x) { if (num(x.ordem) > base) base = num(x.ordem); });
    var novos = [];
    VIDEOS_SITE.forEach(function (v) {
      var link = "https://youtube.com/shorts/" + v[1];
      var existe = S.videos.some(function (x) { return x.link === link && x.nicho === v[2]; });
      if (!existe) novos.push({ titulo: v[0], link: link, nicho: v[2], ordem: ++base, visivel: true });
    });
    if (!novos.length) { toast("Todos os vídeos do site já estão aqui"); return; }
    db.from("videos").insert(novos).select().then(function (r) {
      if (r.error) { toast(erroAmigavel("videos", r.error), true); return; }
      S.videos = S.videos.concat(r.data || []);
      toast(novos.length + " vídeos importados");
      renderPortfolio();
    }, function (e) { toast(erroAmigavel("videos", e), true); });
  }

  function atualizarTopoPortfolio() { if (atual === "portfolio") renderPortfolio(); }

  function salvarOrdem(lista) {
    var mudou = [];
    lista.forEach(function (v, i) { if (num(v.ordem) !== i + 1) { v.ordem = i + 1; mudou.push(v); } });
    desenharVideos();
    if (!mudou.length) return;
    Promise.all(mudou.map(function (v) { return db.from("videos").update({ ordem: v.ordem }).eq("id", v.id); })).then(function (rs) {
      var er = rs.filter(function (r) { return r.error; })[0];
      if (er) toast(erroAmigavel("videos", er.error), true); else toast("Ordem salva");
    });
  }
  function moverVideo(id, delta) {
    var lista = videosOrdenados(), i = -1, k;
    for (k = 0; k < lista.length; k++) if (String(lista[k].id) === String(id)) i = k;
    var j = i + delta; if (i < 0 || j < 0 || j >= lista.length) return;
    var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
    salvarOrdem(lista);
  }

  /* arrastar e soltar pela alça */
  var arrastandoId = null;
  function ligarArrastar() {
    var aba = $("#aba");
    aba.addEventListener("mousedown", function (e) {
      var al = e.target.closest("[data-alca]"); if (!al) return;
      al.closest("tr").draggable = true;
    });
    aba.addEventListener("dragstart", function (e) {
      var tr = e.target.closest && e.target.closest("#tbVideos tr"); if (!tr) return;
      arrastandoId = tr.dataset.id; tr.classList.add("arrastando");
      try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", arrastandoId); } catch (x) {}
    });
    aba.addEventListener("dragover", function (e) {
      var tr = e.target.closest && e.target.closest("#tbVideos tr"); if (!tr || arrastandoId == null) return;
      e.preventDefault();
      $$("#tbVideos tr.alvo").forEach(function (x) { x.classList.remove("alvo"); });
      tr.classList.add("alvo");
    });
    aba.addEventListener("drop", function (e) {
      var tr = e.target.closest && e.target.closest("#tbVideos tr"); if (!tr || arrastandoId == null) return;
      e.preventDefault();
      var lista = videosOrdenados(), de = -1, para = -1;
      lista.forEach(function (v, i) {
        if (String(v.id) === String(arrastandoId)) de = i;
        if (String(v.id) === String(tr.dataset.id)) para = i;
      });
      arrastandoId = null;
      if (de < 0 || para < 0 || de === para) { desenharVideos(); return; }
      var item = lista.splice(de, 1)[0]; lista.splice(para, 0, item);
      salvarOrdem(lista);
    });
    aba.addEventListener("dragend", function () {
      arrastandoId = null;
      $$("#tbVideos tr").forEach(function (x) { x.classList.remove("arrastando", "alvo"); x.draggable = false; });
    });
  }

  /* ------------------------ 6. ABA MARCAS ------------------------ */
  var mk = { busca: "", sit: "" };

  function limparInsta(s) {
    return String(s || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[\/?#].*$/, "");
  }
  function linkZap(tel) {
    var d = String(tel || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.length <= 11) d = "55" + d;
    return "https://wa.me/" + d;
  }

  function renderMarcas() {
    var h = cab("Marcas", "Sua base de contatos de empresas.",
      '<button class="btn btn-ghost" data-acao="marcas-csv" type="button">' + ICON.baixar + "Baixar CSV</button>" +
      '<button class="btn btn-main" data-acao="marca-nova" type="button">' + ICON.mais + "Adicionar marca</button>");
    h += '<div class="ferramentas"><input class="in" id="mkBusca" type="search" placeholder="Buscar por nome, @ ou e-mail" value="' + esc(mk.busca) + '" data-ao="mk-busca">' +
      '<select class="in" id="mkSit" data-ao="mk-sit"><option value="">Todas as situações</option>' +
      SITUACOES.map(function (s) { return '<option value="' + s[0] + '"' + (mk.sit === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") +
      '</select><span id="mkContagem" class="dica"></span></div>';
    h += '<div class="tabela-wrap"><table style="min-width:900px"><thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th><th></th></tr></thead><tbody id="tbMarcas"></tbody></table></div>';
    $("#aba").innerHTML = h;
    desenharMarcas();
  }

  function marcasFiltradas() {
    var b = mk.busca.trim().toLowerCase().replace(/^@/, "");
    return S.marcas.filter(function (m) {
      if (mk.sit && m.situacao !== mk.sit) return false;
      if (!b) return true;
      return [m.nome, m.instagram, m.email].join(" ").toLowerCase().indexOf(b) >= 0;
    }).sort(function (a, c) { return cmpTexto(a.nome, c.nome); });
  }

  function desenharMarcas() {
    var tb = $("#tbMarcas"); if (!tb) return;
    var lista = marcasFiltradas();
    var cont = $("#mkContagem"); if (cont) cont.textContent = plural(lista.length, "contato", "contatos");
    if (!lista.length) {
      tb.innerHTML = '<tr><td colspan="8"><div class="vazio">' + (S.marcas.length ? "Nada encontrado com esse filtro." : "Nenhuma marca ainda. Os contatos do formulário do site chegam aqui como Lead.") + "</div></td></tr>";
      return;
    }
    tb.innerHTML = lista.map(function (m) {
      var ig = limparInsta(m.instagram), zap = linkZap(m.telefone);
      return '<tr class="clicavel" data-acao="marca-editar" data-id="' + esc(m.id) + '">' +
        "<td><b>" + esc(m.nome) + "</b>" + exTag(m) + "</td>" +
        "<td>" + (ig ? '<a href="https://instagram.com/' + esc(ig) + '" target="_blank" rel="noopener noreferrer" data-solto>@' + esc(ig) + "</a>" : "") + "</td>" +
        "<td>" + esc(m.email) + "</td><td>" + esc(m.telefone) + "</td>" +
        '<td><span class="pill p-' + esc(m.situacao) + '">' + esc(rotuloSit(m.situacao)) + "</span></td>" +
        '<td class="obs-c" title="' + esc(m.obs) + '">' + esc(m.obs) + "</td><td>" + esc(dataBR(m.ultimo_contato)) + "</td>" +
        '<td class="acoes-c">' + (zap ? '<a class="icon-btn" href="' + esc(zap) + '" target="_blank" rel="noopener noreferrer" data-solto aria-label="Abrir WhatsApp" title="Abrir WhatsApp">' + ICON.zap + "</a>" : "") + "</td></tr>";
    }).join("");
  }

  function formMarca(m) {
    formulario({
      titulo: m ? "Editar marca" : "Adicionar marca",
      valores: m || { situacao: "lead" },
      campos: [
        { k: "nome", r: "Marca", req: true },
        { k: "instagram", r: "Instagram", m: true, ph: "@marca" },
        { k: "telefone", r: "Telefone (com DDD)", m: true, ph: "44999999999" },
        { k: "email", r: "E-mail", t: "email" },
        { k: "situacao", r: "Situação", t: "select", op: SITUACOES, m: true },
        { k: "ultimo_contato", r: "Último contato", t: "date", m: true },
        { k: "obs", r: "Observação", t: "textarea" }
      ],
      onSalvar: function (o) {
        return gravar("marcas", m ? m.id : null, o).then(function (r) { if (r) { toast("Marca salva"); desenharMarcas(); } return !!r; });
      },
      onApagar: m ? function () {
        return apagar("marcas", m.id).then(function (ok) { if (ok) { toast("Marca apagada"); desenharMarcas(); } return ok; });
      } : null,
      msgApagar: "Apagar esta marca da sua base?"
    });
  }

  /* ------------------------ 7. ABA CALENDÁRIO ------------------------ */
  var hj0 = new Date();
  var cal = { ano: hj0.getFullYear(), mes: hj0.getMonth(), filtro: "todos" };
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  function itensDoCalendario() {
    var f = cal.filtro, itens = [];
    if (f === "todos" || f === "gravar" || f === "editar" || f === "postar") {
      S.calendario.forEach(function (c) {
        if (!c.data) return;
        if (f !== "todos" && c.tipo !== f) return;
        itens.push({ origem: "cal", id: c.id, titulo: c.titulo, tipo: c.tipo || "gravar", feito: c.status === "feito", data: String(c.data).slice(0, 10), marca: c.marca });
      });
    }
    if (f === "todos" || f === "prazo") {
      S.campanhas.forEach(function (c) {
        if (!c.prazo) return;
        itens.push({ origem: "camp", id: c.id, titulo: "Prazo: " + (c.campanha || ""), tipo: "prazo", feito: c.status === "Entregue", data: String(c.prazo).slice(0, 10), marca: c.cliente });
      });
    }
    return itens;
  }

  function renderCalendario() {
    var h = cab("Calendário", "O que gravar, editar e postar. Os prazos das campanhas entram sozinhos.",
      '<button class="btn btn-main" data-acao="cal-novo" data-data="' + hojeISO() + '" type="button">' + ICON.mais + "Adicionar item</button>");
    h += '<div class="cal-nav"><button class="icon-btn" data-acao="cal-ant" type="button" aria-label="Mês anterior">' + ICON.esq + "</button>" +
      "<h2>" + MESES[cal.mes].charAt(0).toUpperCase() + MESES[cal.mes].slice(1) + " de " + cal.ano + "</h2>" +
      '<button class="icon-btn" data-acao="cal-prox" type="button" aria-label="Próximo mês">' + ICON.dir + "</button>" +
      '<button class="btn btn-ghost btn-mini" data-acao="cal-hoje" type="button">Este mês</button>' +
      '<div class="chips" style="margin-left:auto">' +
      [["todos", "Todos"], ["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"], ["prazo", "Prazos"]].map(function (c) {
        return '<button class="chip' + (cal.filtro === c[0] ? " on" : "") + '" type="button" data-acao="cal-filtro" data-v="' + c[0] + '">' + c[1] + "</button>";
      }).join("") + "</div></div>";

    var itens = itensDoCalendario(), porDia = {};
    itens.forEach(function (it) { (porDia[it.data] = porDia[it.data] || []).push(it); });
    var primeiro = new Date(cal.ano, cal.mes, 1), diasMes = new Date(cal.ano, cal.mes + 1, 0).getDate();
    var desloc = (primeiro.getDay() + 6) % 7, linhas = Math.ceil((desloc + diasMes) / 7), hoje = hojeISO();
    h += '<div class="grade">' + DOW.map(function (d) { return '<div class="dow">' + d + "</div>"; }).join("");
    for (var i = 0; i < linhas * 7; i++) {
      var d = new Date(cal.ano, cal.mes, 1 - desloc + i), di = iso(d), fora = d.getMonth() !== cal.mes;
      var its = porDia[di] || [], cls = "dia" + (fora ? " fora" : "") + (di === hoje ? " hoje" : "");
      h += '<div class="' + cls + '" data-acao="cal-novo" data-data="' + di + '"><span class="dnum">' + d.getDate() + "</span>" +
        '<button class="add-dia" type="button" data-acao="cal-novo" data-data="' + di + '" aria-label="Adicionar neste dia">+</button>';
      its.slice(0, 3).forEach(function (it) {
        h += '<button type="button" class="it t-' + esc(it.tipo) + (it.feito ? " feito" : "") + '" data-acao="cal-item" data-origem="' + it.origem + '" data-id="' + esc(it.id) + '" title="' + esc(it.titulo) + '">' + esc(it.titulo) + "</button>";
      });
      if (its.length > 3) h += '<button type="button" class="mais" data-acao="cal-dia" data-data="' + di + '">+' + (its.length - 3) + " mais</button>";
      h += "</div>";
    }
    h += "</div>";

    /* Ficou pra trás */
    var atrasados = [];
    S.calendario.forEach(function (c) {
      if (c.data && c.status !== "feito" && String(c.data).slice(0, 10) < hoje) atrasados.push({ origem: "cal", id: c.id, titulo: c.titulo, sub: [rotuloTipoCal(c.tipo), c.marca].filter(Boolean).join(" · "), data: String(c.data).slice(0, 10) });
    });
    S.campanhas.forEach(function (c) {
      if (c.prazo && c.status !== "Entregue" && c.ativa !== false && String(c.prazo).slice(0, 10) < hoje) atrasados.push({ origem: "camp", id: c.id, titulo: c.campanha, sub: "Prazo de campanha" + (c.cliente ? " · " + c.cliente : ""), data: String(c.prazo).slice(0, 10) });
    });
    atrasados.sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    h += '<section class="card" style="margin-top:16px"><h2>Ficou pra trás</h2>';
    if (!atrasados.length) h += '<div class="vazio">Nada atrasado. Tudo em dia.</div>';
    else {
      h += '<ul class="lista-simples">' + atrasados.map(function (a) {
        var n = diasEntre(a.data, hoje);
        return "<li>" + (a.origem === "cal" ? '<button class="icon-btn" type="button" data-acao="cal-feito" data-id="' + esc(a.id) + '" aria-label="Marcar como feito" title="Marcar como feito">' + ICON.check + "</button>" : "") +
          '<div class="txt"><a href="#" data-acao="cal-item" data-origem="' + a.origem + '" data-id="' + esc(a.id) + '">' + esc(a.titulo) + "</a><small>" + esc(a.sub) + " · " + dataBR(a.data) + "</small></div>" +
          '<span class="atraso-d">há ' + plural(n, "dia", "dias") + "</span></li>";
      }).join("") + "</ul>";
    }
    h += "</section>";
    $("#aba").innerHTML = h;
  }

  function formCalendario(c, dataPadrao) {
    formulario({
      titulo: c ? "Editar item" : "Novo item",
      valores: c ? { titulo: c.titulo, marca: c.marca, tipo: c.tipo, data: String(c.data || "").slice(0, 10), status: c.status } : { data: dataPadrao || hojeISO(), tipo: "gravar", status: "a fazer" },
      campos: [
        { k: "titulo", r: "O que é", req: true },
        { k: "marca", r: "Marca", m: true },
        { k: "data", r: "Data", t: "date", req: true, m: true },
        { k: "tipo", r: "Tipo", t: "select", op: TIPOS_CAL, m: true },
        { k: "status", r: "Status", t: "select", op: [["a fazer", "A fazer"], ["feito", "Feito"]], m: true }
      ],
      onSalvar: function (o) {
        return gravar("calendario", c ? c.id : null, o).then(function (r) { if (r) { toast("Item salvo"); renderCalendario(); } return !!r; });
      },
      onApagar: c ? function () {
        return apagar("calendario", c.id).then(function (ok) { if (ok) { toast("Item apagado"); renderCalendario(); } return ok; });
      } : null,
      msgApagar: "Apagar este item do calendário?"
    });
  }

  function janelaDia(di) {
    var its = itensDoCalendario().filter(function (i) { return i.data === di; });
    var h = "<h2>" + dataBR(di) + "</h2>";
    h += its.length ? '<ul class="lista-simples">' + its.map(function (it) {
      return '<li><div class="txt"><a href="#" data-acao="cal-item" data-origem="' + it.origem + '" data-id="' + esc(it.id) + '">' + esc(it.titulo) + "</a><small>" +
        esc(it.tipo === "prazo" ? "Prazo de campanha" : rotuloTipoCal(it.tipo)) + (it.marca ? " · " + esc(it.marca) : "") + (it.feito ? " · feito" : "") + "</small></div></li>";
    }).join("") + "</ul>" : '<div class="vazio">Nada neste dia.</div>';
    h += '<div class="dlg-rod"><button class="btn btn-ghost" type="button" data-acao="fechar-janela">Fechar</button>' +
      '<button class="btn btn-main" type="button" data-acao="cal-novo" data-data="' + di + '">' + ICON.mais + "Adicionar neste dia</button></div>";
    abrirJanela(h);
  }

  /* ------------------------ 8. ABA CAMPANHAS ------------------------ */
  var cp = { filtro: "todas", busca: "", ord: "prazo", dir: 1 };
  var COLUNAS = [
    ["favorita", "★", "estrela"], ["campanha", "Campanha"], ["cliente", "Cliente"], ["tipo", "Tipo"], ["status", "Status"],
    ["qtd", "Qtd", "num"], ["valor", "Valor", "num"], ["prazo", "Prazo"], ["pagamento", "Pagamento"]
  ];

  function renderCampanhas() {
    var base = reais(S.campanhas);
    var qtd = 0, valor = 0, aReceber = 0, recebido = 0, ativas = 0;
    base.forEach(function (c) {
      qtd += num(c.qtd); valor += num(c.valor);
      if (c.pagamento === "pago") recebido += num(c.valor); else aReceber += num(c.valor);
      if (c.ativa !== false) ativas++;
    });
    var ticket = qtd > 0 ? valor / qtd : 0;
    var h = cab("Campanhas", "Seus trabalhos fechados com marcas.",
      '<button class="btn btn-ghost" data-acao="camp-csv" type="button">' + ICON.baixar + "Baixar CSV</button>" +
      '<button class="btn btn-main" data-acao="camp-nova" type="button">' + ICON.mais + "Adicionar campanha</button>");
    h += '<div class="strip q4">' +
      "<div><small>Campanhas</small><b>" + base.length + "</b></div>" +
      "<div><small>Ativas</small><b>" + ativas + "</b></div>" +
      "<div><small>Valor total</small><b>" + moeda(valor) + "</b><em>Ticket médio por vídeo: " + moeda(ticket) + "</em></div>" +
      "<div><small>A receber</small><b>" + moeda(aReceber) + "</b><em>Já recebido: " + moeda(recebido) + "</em></div></div>";
    h += '<div class="ferramentas"><div class="chips">' +
      [["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(function (c) {
        return '<button class="chip' + (cp.filtro === c[0] ? " on" : "") + '" type="button" data-acao="camp-filtro" data-v="' + c[0] + '">' + c[1] + "</button>";
      }).join("") + '</div><input class="in" id="cpBusca" type="search" placeholder="Buscar campanha ou cliente" value="' + esc(cp.busca) + '" data-ao="cp-busca"></div>';
    h += '<div class="tabela-wrap"><table style="min-width:900px"><thead id="thCamp"></thead><tbody id="tbCamp"></tbody></table></div>';
    $("#aba").innerHTML = h;
    desenharCampanhas();
  }

  function valorOrdem(c, col) {
    switch (col) {
      case "favorita": return c.favorita === true ? 0 : 1;
      case "status": var i = FUNIL.indexOf(c.status); return i < 0 ? 99 : i;
      case "qtd": return num(c.qtd);
      case "valor": return num(c.valor);
      case "prazo": return c.prazo ? String(c.prazo).slice(0, 10) : null;
      case "pagamento": return c.pagamento === "pago" ? 1 : 0;
      default: return String(c[col] || "").toLowerCase();
    }
  }

  function desenharCampanhas() {
    var th = $("#thCamp"), tb = $("#tbCamp"); if (!th || !tb) return;
    th.innerHTML = "<tr>" + COLUNAS.map(function (c) {
      var ativo = cp.ord === c[0];
      return '<th class="' + (ativo ? "ord" : "") + (c[2] === "num" ? " num" : "") + '" aria-sort="' + (ativo ? (cp.dir > 0 ? "ascending" : "descending") : "none") + '">' +
        '<button type="button" data-acao="camp-ord" data-col="' + c[0] + '">' + esc(c[1]) + '<span class="seta">' + (ativo ? (cp.dir > 0 ? "▲" : "▼") : "↕") + "</span></button></th>";
    }).join("") + "</tr>";

    var b = cp.busca.trim().toLowerCase();
    var lista = S.campanhas.filter(function (c) {
      if (cp.filtro === "ativas" && c.ativa === false) return false;
      if (cp.filtro === "finalizadas" && c.ativa !== false) return false;
      if (b && [c.campanha, c.cliente].join(" ").toLowerCase().indexOf(b) < 0) return false;
      return true;
    });
    lista.sort(function (x, y) {
      var a = valorOrdem(x, cp.ord), c = valorOrdem(y, cp.ord);
      if (a === null && c === null) return 0;
      if (a === null) return 1; /* sem valor sempre no fim */
      if (c === null) return -1;
      var r = a < c ? -1 : a > c ? 1 : 0;
      if (r === 0) r = cmpTexto(x.campanha, y.campanha);
      return r * cp.dir;
    });

    if (!lista.length) {
      tb.innerHTML = '<tr><td colspan="9"><div class="vazio">' + (S.campanhas.length ? "Nenhuma campanha com esse filtro." : "Nenhuma campanha ainda. Clique em Adicionar campanha.") + "</div></td></tr>";
      return;
    }
    var hoje = hojeISO();
    tb.innerHTML = lista.map(function (c) {
      var si = FUNIL.indexOf(c.status), etq = "";
      if (c.prazo && c.status !== "Entregue") {
        var n = diasEntre(hoje, String(c.prazo).slice(0, 10));
        if (n < 0) etq = '<span class="etq atraso">atrasado ' + plural(-n, "dia", "dias") + "</span>";
        else if (n <= 3) etq = '<span class="etq perto">' + (n === 0 ? "vence hoje" : "vence em " + plural(n, "dia", "dias")) + "</span>";
      }
      return '<tr class="clicavel' + (c.favorita === true ? " fav" : "") + '" data-acao="camp-editar" data-id="' + esc(c.id) + '">' +
        '<td><button class="estrela' + (c.favorita === true ? " on" : "") + '" type="button" data-acao="camp-estrela" data-id="' + esc(c.id) + '" aria-label="Destacar campanha" aria-pressed="' + (c.favorita === true) + '">' + ICON.estrela + "</button></td>" +
        "<td><b>" + esc(c.campanha) + "</b>" + exTag(c) + "</td><td>" + esc(c.cliente) + "</td>" +
        '<td><span class="pill ' + (c.tipo === "Publicidade" ? "p-publicidade" : "p-conteudo") + '">' + esc(c.tipo) + "</span></td>" +
        '<td><span class="pill p-s' + (si < 0 ? 0 : si) + '">' + esc(c.status) + "</span></td>" +
        '<td class="num">' + num(c.qtd) + '</td><td class="num">' + moeda(c.valor) + "</td>" +
        "<td>" + esc(dataBR(c.prazo)) + etq + "</td>" +
        '<td><button class="pill p-' + (c.pagamento === "pago" ? "pago" : "pendente") + '" type="button" data-acao="camp-pago" data-id="' + esc(c.id) + '" title="Clique para trocar">' + (c.pagamento === "pago" ? "Pago" : "Pendente") + "</button></td>" +
        "</tr>";
    }).join("");
  }

  function formCampanha(c) {
    formulario({
      titulo: c ? "Editar campanha" : "Adicionar campanha",
      valores: c || { tipo: "Conteúdo", status: "Briefing", qtd: 1, valor: 0, pagamento: "pendente", ativa: true },
      campos: [
        { k: "campanha", r: "Campanha", req: true },
        { k: "cliente", r: "Cliente" },
        { k: "tipo", r: "Tipo", t: "select", op: TIPOS_CAMP, m: true },
        { k: "status", r: "Status", t: "select", op: FUNIL, m: true },
        { k: "qtd", r: "Quantidade de vídeos", t: "number", m: true },
        { k: "valor", r: "Valor (R$)", t: "number", passo: "0.01", m: true },
        { k: "prazo", r: "Prazo", t: "date", m: true },
        { k: "pagamento", r: "Pagamento", t: "select", op: [["pendente", "Pendente"], ["pago", "Pago"]], m: true },
        { k: "ativa", r: "Campanha ativa", t: "check" },
        { k: "favorita", r: "Destacar com estrela", t: "check" }
      ],
      onSalvar: function (o) {
        if (c && o.status === "Entregue" && c.status !== "Entregue") o.ativa = false; /* entregou, finalizou */
        return gravar("campanhas", c ? c.id : null, o).then(function (r) { if (r) { toast("Campanha salva"); renderCampanhas(); } return !!r; });
      },
      onApagar: c ? function () {
        return apagar("campanhas", c.id).then(function (ok) { if (ok) { toast("Campanha apagada"); renderCampanhas(); } return ok; });
      } : null,
      msgApagar: "Apagar esta campanha?"
    });
  }

  /* ------------------------ 9. ABA CHECKLIST ------------------------ */
  var ck = { sub: "checklist", abertos: {}, nicho: null, revisao: {}, roteiro: "" };
  var SUBABAS = [["checklist", "Checklist do portfólio"], ["refs", "Referências de vídeo"], ["roteiros", "Roteiros"], ["nichos", "Ideias por nicho"], ["revisar", "Revisar meu roteiro"]];

  function renderChecklist() {
    var h = cab("Checklist", "Consulta e conferência para o seu portfólio e para os seus roteiros.", "");
    h += '<div class="subabas">' + SUBABAS.map(function (s) {
      return '<button class="chip' + (ck.sub === s[0] ? " on" : "") + '" type="button" data-acao="ck-sub" data-v="' + s[0] + '">' + s[1] + "</button>";
    }).join("") + '</div><div id="ckCorpo"></div>';
    $("#aba").innerHTML = h;
    desenharSub();
  }

  function desenharSub() {
    var B = window.Biblioteca, el = $("#ckCorpo");
    if (!B) { el.innerHTML = '<div class="vazio">O arquivo js/biblioteca.js não carregou, então não tem conteúdo para mostrar aqui.</div>'; return; }
    var f = { checklist: subChecklist, refs: subRefs, roteiros: subRoteiros, nichos: subNichos, revisar: subRevisar }[ck.sub];
    try { el.innerHTML = f(B); } catch (e) { console.error(e); el.innerHTML = '<div class="vazio">Não consegui montar esta parte da biblioteca.</div>'; }
    if (ck.sub === "checklist") atualizarProgressoCheck();
    if (ck.sub === "revisar") atualizarProgressoRevisao();
  }

  function acordeao(chave, aberto, emoji, titulo, sub, corpo) {
    return '<section class="acord' + (aberto ? " aberto" : "") + '" data-chave="' + esc(chave) + '">' +
      '<button class="cab-a" type="button" data-acao="acord" data-chave="' + esc(chave) + '" aria-expanded="' + (aberto ? "true" : "false") + '">' +
      '<span class="emo">' + esc(emoji || "") + '</span><span class="tit"><b>' + esc(titulo) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" +
      '<span class="seta-a">' + ICON.seta + "</span></button>" + '<div class="corpo">' + corpo + "</div></section>";
  }

  function subChecklist(B) {
    var h = '<div class="card"><div class="prog-linha"><b style="color:var(--vinho)">Geral</b><div class="prog"><i id="progGeral"></i></div><span id="progGeralTxt"></span></div></div>';
    (B.CHECKLIST || []).forEach(function (sec) {
      var corpo = '<div class="porque"><b>Por quê:</b> ' + esc(sec.porque) + "</div>";
      (sec.itens || []).forEach(function (it, i) {
        var chave = "checklist:" + sec.id + ":" + i, feito = S.marcados[chave] === true, id = "ck_" + sec.id + "_" + i;
        corpo += '<div class="item-ck' + (feito ? " feito" : "") + '"><input type="checkbox" id="' + id + '" data-ao="ck-marcar" data-chave="' + esc(chave) + '"' + (feito ? " checked" : "") + '>' +
          '<label for="' + id + '"><b>' + esc(it.t) + "</b><span>" + esc(it.d) + "</span></label></div>";
      });
      corpo = '<div class="prog-linha" style="margin-bottom:10px"><div class="prog"><i data-prog="' + esc(sec.id) + '"></i></div><span data-progtxt="' + esc(sec.id) + '"></span></div>' + corpo;
      h += acordeao("ck:" + sec.id, ck.abertos["ck:" + sec.id], sec.emoji, sec.nome, sec.resumo, corpo);
    });
    return h;
  }

  function atualizarProgressoCheck() {
    var B = window.Biblioteca; if (!B) return;
    var totalG = 0, feitoG = 0;
    (B.CHECKLIST || []).forEach(function (sec) {
      var t = (sec.itens || []).length, f = 0;
      for (var i = 0; i < t; i++) if (S.marcados["checklist:" + sec.id + ":" + i] === true) f++;
      totalG += t; feitoG += f;
      var barra = $('[data-prog="' + sec.id + '"]'), txt = $('[data-progtxt="' + sec.id + '"]');
      if (barra) barra.style.width = (t > 0 ? Math.round((f * 100) / t) : 0) + "%";
      if (txt) txt.textContent = f + " de " + t;
    });
    var g = $("#progGeral"), gt = $("#progGeralTxt");
    if (g) g.style.width = (totalG > 0 ? Math.round((feitoG * 100) / totalG) : 0) + "%";
    if (gt) gt.textContent = feitoG + " de " + totalG + " (" + (totalG > 0 ? Math.round((feitoG * 100) / totalG) : 0) + "%)";
  }

  function marcar(chave, valor, caixa) {
    S.marcados[chave] = valor;
    var linha = caixa.closest(".item-ck"); if (linha) linha.classList.toggle("feito", valor);
    atualizarProgressoCheck();
    db.from("marcados").upsert({ chave: chave, marcado: valor, atualizado_em: new Date().toISOString() }).then(function (r) {
      if (r.error) {
        S.marcados[chave] = !valor; caixa.checked = !valor;
        if (linha) linha.classList.toggle("feito", !valor);
        atualizarProgressoCheck();
        toast(erroAmigavel("marcados", r.error), true);
      }
    }, function (e) { toast(erroAmigavel("marcados", e), true); });
  }

  function blocosTempo(lista) {
    return (lista || []).map(function (b) {
      return '<div class="bloco-t"><span class="tempo">' + esc(b.t) + "</span><span>" + htmlSeguro(b.o) + "</span></div>";
    }).join("");
  }

  function subRefs(B) {
    var h = '<div class="refs">';
    (B.REFERENCIAS || []).forEach(function (r) {
      h += '<button class="ref" type="button" data-acao="ref-abrir" data-id="' + esc(r.id) + '"><div class="capa cor-' + esc(r.cor) + '"><span aria-hidden="true">' + esc(r.emoji) + "</span></div>" +
        '<div class="info"><b>' + esc(r.titulo) + "</b><span>" + esc(r.estilo) + " · " + esc(r.duracao) + (r.marca ? " · " + esc(r.marca) : "") + "</span></div></button>";
    });
    return h + "</div>";
  }

  function fichaRef(id) {
    var B = window.Biblioteca, r = null;
    ((B && B.REFERENCIAS) || []).forEach(function (x) { if (x.id === id) r = x; });
    if (!r) return;
    var h = "<h2>" + esc(r.emoji) + " " + esc(r.titulo) + "</h2>" +
      '<p class="dica" style="margin-bottom:12px">' + esc(r.estilo) + " · " + esc(r.duracao) + (r.marca ? " · " + esc(r.marca) : "") + "</p>" +
      '<div class="sec-ficha"><h3>Gancho</h3><p>' + esc(r.gancho) + "</p></div>" +
      '<div class="sec-ficha"><h3>Por que funciona</h3><p>' + esc(r.porque) + "</p></div>" +
      '<div class="sec-ficha"><h3>O diferencial</h3><p>' + esc(r.diferencial) + "</p></div>" +
      '<div class="sec-ficha"><h3>O erro comum</h3><p>' + esc(r.erro) + "</p></div>" +
      '<div class="sec-ficha"><h3>Roteiro</h3>' + blocosTempo(r.roteiro) + "</div>" +
      '<div class="dlg-rod"><button class="btn btn-ghost" type="button" data-acao="fechar-janela">Fechar</button>' +
      (r.youtube ? '<a class="btn btn-main" href="' + esc(r.youtube) + '" target="_blank" rel="noopener noreferrer">Assistir</a>' : "") + "</div>";
    abrirJanela(h, true);
  }

  function subRoteiros(B) {
    return (B.TIPOS || []).map(function (t) {
      var corpo = '<div class="porque"><b>Quando usar:</b> ' + esc(t.porque) + "</div>" + blocosTempo(t.beats);
      if (t.erros && t.erros.length) corpo += '<div class="sec-ficha" style="margin-top:10px"><h3>Erros comuns</h3><ul style="padding-left:18px">' + t.erros.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul></div>";
      return acordeao("tp:" + t.id, ck.abertos["tp:" + t.id], t.emoji, t.nome, t.duracao, corpo);
    }).join("");
  }

  function subNichos(B) {
    var lista = B.NICHOS || [];
    if (!lista.length) return '<div class="vazio">Sem nichos na biblioteca.</div>';
    if (!ck.nicho) ck.nicho = lista[0].id;
    var atualN = lista.filter(function (n) { return n.id === ck.nicho; })[0] || lista[0];
    var h = '<div class="chips" style="margin-bottom:14px">' + lista.map(function (n) {
      return '<button class="chip' + (n.id === atualN.id ? " on" : "") + '" type="button" data-acao="nicho-sel" data-v="' + esc(n.id) + '">' + esc(n.emoji) + " " + esc(n.nome) + "</button>";
    }).join("") + "</div>";
    h += '<div class="card"><h2>' + esc(atualN.emoji) + " " + esc(atualN.nome) + "</h2>";
    (atualN.ideias || []).forEach(function (i) { h += '<div class="nicho-ideia"><b>' + esc(i.t) + "</b><span>" + esc(i.gancho) + "</span></div>"; });
    return h + "</div>";
  }

  function subRevisar(B) {
    var h = '<div class="card"><h2>Cole o seu roteiro aqui</h2><div class="field"><textarea id="roteiroTxt" data-ao="roteiro-txt" style="min-height:150px" placeholder="Cole ou escreva o roteiro e confira os itens abaixo">' + esc(ck.roteiro) + '</textarea></div>' +
      '<div class="prog-linha"><span id="roteiroInfo"></span><div class="prog"><i id="progRev"></i></div><span id="progRevTxt"></span>' +
      '<button class="btn btn-ghost btn-mini" type="button" data-acao="rev-limpar">Limpar conferência</button></div></div>';
    (B.REVISAO || []).forEach(function (bl, bi) {
      var corpo = "";
      (bl.itens || []).forEach(function (it, i) {
        var chave = bi + ":" + i, id = "rv_" + bi + "_" + i;
        corpo += '<div class="item-ck' + (ck.revisao[chave] ? " feito" : "") + '"><input type="checkbox" id="' + id + '" data-ao="rev-marcar" data-chave="' + chave + '"' + (ck.revisao[chave] ? " checked" : "") + '>' +
          '<label for="' + id + '"><b>' + esc(it.t) + "</b><span>" + esc(it.d) + "</span></label></div>";
      });
      h += acordeao("rv:" + bi, ck.abertos["rv:" + bi] !== false, bl.emoji, bl.bloco, "", corpo);
    });
    return h;
  }

  function atualizarProgressoRevisao() {
    var B = window.Biblioteca; if (!B) return;
    var t = 0, f = 0;
    (B.REVISAO || []).forEach(function (bl, bi) { (bl.itens || []).forEach(function (_, i) { t++; if (ck.revisao[bi + ":" + i]) f++; }); });
    var b = $("#progRev"), tx = $("#progRevTxt");
    if (b) b.style.width = (t > 0 ? Math.round((f * 100) / t) : 0) + "%";
    if (tx) tx.textContent = f + " de " + t;
    var info = $("#roteiroInfo");
    if (info) { var palavras = ck.roteiro.trim() ? ck.roteiro.trim().split(/\s+/).length : 0; info.textContent = plural(palavras, "palavra", "palavras"); }
  }

  /* ------------------------ 10. ABA IDEIAS DE ROTEIROS ------------------------ */
  var id_ = { filtro: "" };
  var STATUS_IDEIA = [["ideia", "Ideia"], ["roteirizando", "Roteirizando"], ["gravado", "Gravado"]];
  function rotuloIdeia(v) { for (var i = 0; i < STATUS_IDEIA.length; i++) if (STATUS_IDEIA[i][0] === v) return STATUS_IDEIA[i][1]; return v || ""; }

  function renderIdeias() {
    var h = cab("Ideias de roteiros", "Guarde aqui as ideias antes de elas fugirem.",
      '<button class="btn btn-main" data-acao="ideia-nova" type="button">' + ICON.mais + "Nova ideia</button>");
    h += '<div class="chips" style="margin-bottom:14px"><button class="chip' + (id_.filtro === "" ? " on" : "") + '" type="button" data-acao="ideia-filtro" data-v="">Todas</button>' +
      STATUS_IDEIA.map(function (s) { return '<button class="chip' + (id_.filtro === s[0] ? " on" : "") + '" type="button" data-acao="ideia-filtro" data-v="' + s[0] + '">' + s[1] + "</button>"; }).join("") + "</div>";
    var lista = S.ideias.filter(function (i) { return !id_.filtro || i.status === id_.filtro; })
      .sort(function (a, b) { return String(b.criado_em || "").localeCompare(String(a.criado_em || "")); });
    if (!lista.length) h += '<div class="vazio">' + (S.ideias.length ? "Nenhuma ideia com esse status." : "Nenhuma ideia ainda. Clique em Nova ideia.") + "</div>";
    else {
      h += '<div class="ideias">' + lista.map(function (i) {
        return '<article class="card ideia"><h3>' + esc(i.titulo) + exTag(i) + "</h3>" + (i.texto ? "<p>" + esc(i.texto) + "</p>" : "<p></p>") +
          '<div class="rod"><span class="pill p-s' + (i.status === "gravado" ? 6 : i.status === "roteirizando" ? 4 : 1) + '">' + esc(rotuloIdeia(i.status)) + "</span>" +
          (i.nicho ? '<span class="pill">' + esc(nomeNicho(i.nicho)) + "</span>" : "") +
          '<span style="flex:1"></span><button class="icon-btn" type="button" data-acao="ideia-editar" data-id="' + esc(i.id) + '" aria-label="Editar">' + ICON.editar + "</button></div></article>";
      }).join("") + "</div>";
    }
    $("#aba").innerHTML = h;
  }

  function formIdeia(i) {
    formulario({
      titulo: i ? "Editar ideia" : "Nova ideia",
      valores: i || { status: "ideia" },
      campos: [
        { k: "titulo", r: "Título da ideia", req: true },
        { k: "texto", r: "Gancho e roteiro", t: "textarea", dica: "Escreva do jeito que vier. Depois você organiza." },
        { k: "nicho", r: "Nicho", t: "select", op: [["", "Sem nicho"]].concat(NICHOS_SITE), m: true },
        { k: "status", r: "Status", t: "select", op: STATUS_IDEIA, m: true }
      ],
      onSalvar: function (o) {
        return gravar("ideias", i ? i.id : null, o).then(function (r) { if (r) { toast("Ideia salva"); renderIdeias(); } return !!r; });
      },
      onApagar: i ? function () {
        return apagar("ideias", i.id).then(function (ok) { if (ok) { toast("Ideia apagada"); renderIdeias(); } return ok; });
      } : null,
      msgApagar: "Apagar esta ideia?"
    });
  }

  /* ------------------------ 11. ABAS, MENU E EVENTOS ------------------------ */
  var atual = "portfolio";
  var ABAS = { portfolio: renderPortfolio, marcas: renderMarcas, calendario: renderCalendario, campanhas: renderCampanhas, checklist: renderChecklist, ideias: renderIdeias };

  function abrirAba(id) {
    if (!ABAS[id]) id = "portfolio";
    atual = id;
    $$(".menu-item").forEach(function (b) { b.classList.toggle("ativo", b.dataset.aba === id); });
    fecharMenu();
    try { ABAS[id](); }
    catch (e) {
      console.error(e);
      $("#aba").innerHTML = '<div class="faixa aviso">Não consegui montar esta aba. O resto do painel continua funcionando. Detalhe: ' + esc(e && e.message) + "</div>";
    }
    window.scrollTo(0, 0);
  }
  function abrirMenu() { $("#menu").classList.add("aberto"); $("#fundoMenu").classList.add("aberto"); }
  function fecharMenu() { $("#menu").classList.remove("aberto"); $("#fundoMenu").classList.remove("aberto"); }

  var ACOES = {
    "video-novo": function () { formVideo(null); },
    "video-importar": function () { importarVideosDoSite(); },
    "video-editar": function (el) { var v = achar("videos", el.dataset.id); if (v) formVideo(v); },
    "video-apagar": function (el) {
      var v = achar("videos", el.dataset.id); if (!v) return;
      confirmar("Apagar o vídeo “" + v.titulo + "”? Ele some do painel e do site.").then(function (s) {
        if (s) apagar("videos", v.id).then(function (ok) { if (ok) { toast("Vídeo apagado"); renderPortfolio(); } });
      });
    },
    "video-olho": function (el) {
      var v = achar("videos", el.dataset.id); if (!v) return;
      gravar("videos", v.id, { visivel: v.visivel === false }).then(function (r) { if (r) { toast(r.visivel === false ? "Escondido do site" : "Visível no site"); renderPortfolio(); } });
    },
    "video-sobe": function (el) { moverVideo(el.dataset.id, -1); },
    "video-desce": function (el) { moverVideo(el.dataset.id, 1); },

    "marca-nova": function () { formMarca(null); },
    "marca-editar": function (el, ev) {
      if (ev.target.closest("[data-solto]")) return;
      var m = achar("marcas", el.dataset.id); if (m) formMarca(m);
    },
    "marcas-csv": function () {
      var linhas = [["Marca", "Instagram", "E-mail", "Telefone", "Situação", "Observação", "Último contato"]];
      marcasFiltradas().forEach(function (m) { linhas.push([m.nome, m.instagram, m.email, m.telefone, rotuloSit(m.situacao), m.obs, dataBR(m.ultimo_contato)]); });
      baixarCSV("marcas.csv", linhas);
    },

    "cal-ant": function () { cal.mes--; if (cal.mes < 0) { cal.mes = 11; cal.ano--; } renderCalendario(); },
    "cal-prox": function () { cal.mes++; if (cal.mes > 11) { cal.mes = 0; cal.ano++; } renderCalendario(); },
    "cal-hoje": function () { var d = new Date(); cal.ano = d.getFullYear(); cal.mes = d.getMonth(); renderCalendario(); },
    "cal-filtro": function (el) { cal.filtro = el.dataset.v; renderCalendario(); },
    "cal-novo": function (el, ev) {
      if (ev.target.closest('[data-acao="cal-item"],[data-acao="cal-dia"]')) return;
      ev.stopPropagation();
      formCalendario(null, el.dataset.data);
    },
    "cal-dia": function (el, ev) { ev.stopPropagation(); janelaDia(el.dataset.data); },
    "cal-item": function (el, ev) {
      ev.preventDefault(); ev.stopPropagation();
      if (el.dataset.origem === "camp") { var c = achar("campanhas", el.dataset.id); if (c) formCampanha(c); }
      else { var x = achar("calendario", el.dataset.id); if (x) formCalendario(x); }
    },
    "cal-feito": function (el) {
      var x = achar("calendario", el.dataset.id); if (!x) return;
      gravar("calendario", x.id, { status: "feito" }).then(function (r) { if (r) { toast("Marcado como feito"); renderCalendario(); } });
    },

    "camp-nova": function () { formCampanha(null); },
    "camp-editar": function (el, ev) {
      if (ev.target.closest("[data-acao='camp-estrela'],[data-acao='camp-pago'],button.estrela")) return;
      var c = achar("campanhas", el.dataset.id); if (c) formCampanha(c);
    },
    "camp-filtro": function (el) { cp.filtro = el.dataset.v; renderCampanhas(); },
    "camp-ord": function (el) {
      var col = el.dataset.col;
      if (cp.ord === col) cp.dir = -cp.dir; else { cp.ord = col; cp.dir = 1; }
      desenharCampanhas();
    },
    "camp-estrela": function (el, ev) {
      ev.stopPropagation();
      var c = achar("campanhas", el.dataset.id); if (!c) return;
      gravar("campanhas", c.id, { favorita: c.favorita !== true }).then(function (r) { if (r) desenharCampanhas(); });
    },
    "camp-pago": function (el, ev) {
      ev.stopPropagation();
      var c = achar("campanhas", el.dataset.id); if (!c) return;
      gravar("campanhas", c.id, { pagamento: c.pagamento === "pago" ? "pendente" : "pago" }).then(function (r) { if (r) renderCampanhas(); });
    },
    "camp-csv": function () {
      var linhas = [["Campanha", "Cliente", "Tipo", "Status", "Qtd", "Valor", "Prazo", "Pagamento", "Ativa", "Favorita"]];
      S.campanhas.forEach(function (c) {
        linhas.push([c.campanha, c.cliente, c.tipo, c.status, num(c.qtd), num(c.valor).toFixed(2).replace(".", ","), dataBR(c.prazo), c.pagamento === "pago" ? "Pago" : "Pendente", c.ativa === false ? "Não" : "Sim", c.favorita === true ? "Sim" : "Não"]);
      });
      baixarCSV("campanhas.csv", linhas);
    },

    "ck-sub": function (el) { ck.sub = el.dataset.v; renderChecklist(); },
    "acord": function (el) {
      var sec = el.closest(".acord"), aberto = !sec.classList.contains("aberto");
      sec.classList.toggle("aberto", aberto); el.setAttribute("aria-expanded", aberto ? "true" : "false");
      ck.abertos[el.dataset.chave] = aberto;
    },
    "ref-abrir": function (el) { fichaRef(el.dataset.id); },
    "nicho-sel": function (el) { ck.nicho = el.dataset.v; desenharSub(); },
    "rev-limpar": function () { ck.revisao = {}; desenharSub(); },

    "ideia-nova": function () { formIdeia(null); },
    "ideia-editar": function (el) { var i = achar("ideias", el.dataset.id); if (i) formIdeia(i); },
    "ideia-filtro": function (el) { id_.filtro = el.dataset.v; renderIdeias(); },

    "fechar-janela": function () { fecharJanela(); }
  };

  function ligarEventos() {
    /* cliques: procura o elemento com data-acao mais próximo (dentro da aba ou das janelas) */
    function porClique(ev) {
      var el = ev.target.closest("[data-acao]");
      if (!el) return;
      var f = ACOES[el.dataset.acao];
      if (f) f(el, ev);
    }
    $("#aba").addEventListener("click", porClique);
    dlg.addEventListener("click", porClique);

    /* campos que mudam */
    $("#aba").addEventListener("input", function (e) {
      var t = e.target, ao = t.dataset && t.dataset.ao;
      if (ao === "mk-busca") { mk.busca = t.value; desenharMarcas(); }
      else if (ao === "cp-busca") { cp.busca = t.value; desenharCampanhas(); }
      else if (ao === "roteiro-txt") { ck.roteiro = t.value; atualizarProgressoRevisao(); }
    });
    $("#aba").addEventListener("change", function (e) {
      var t = e.target, ao = t.dataset && t.dataset.ao;
      if (ao === "mk-sit") { mk.sit = t.value; desenharMarcas(); }
      else if (ao === "ck-marcar") marcar(t.dataset.chave, t.checked, t);
      else if (ao === "rev-marcar") {
        ck.revisao[t.dataset.chave] = t.checked;
        var linha = t.closest(".item-ck"); if (linha) linha.classList.toggle("feito", t.checked);
        atualizarProgressoRevisao();
      }
    });

    $$(".menu-item").forEach(function (b) {
      b.addEventListener("click", function () { location.hash = b.dataset.aba; });
    });
    window.addEventListener("hashchange", function () { abrirAba(location.hash.replace("#", "")); });
    $("#btnMenu").addEventListener("click", abrirMenu);
    $("#fundoMenu").addEventListener("click", fecharMenu);
    $("#btnSair").addEventListener("click", function () {
      db.auth.signOut().then(paraLogin, paraLogin);
    });
    db.auth.onAuthStateChange(function (evento) { if (evento === "SIGNED_OUT") paraLogin(); });
    ligarArrastar();
  }

  /* ------------------------ 12. COMEÇAR ------------------------ */
  function iniciar(sessao) {
    dlg = $("#dlg");
    var email = sessao && sessao.user && sessao.user.email;
    $("#quemEmail").textContent = email || "";
    ligarEventos();
    $("#carregando").hidden = true;
    $("#app").hidden = false; /* só agora o painel aparece */

    $("#aba").innerHTML = '<div class="vazio">Carregando seus dados...</div>';
    carregarTudo().then(function () {
      desenharAvisos();
      abrirAba(location.hash.replace("#", "") || "portfolio");
    }, function (e) {
      console.error(e);
      desenharAvisos();
      abrirAba("portfolio");
    });
  }
})();
