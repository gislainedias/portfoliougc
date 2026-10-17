/* =====================================================================
   RADAR DE NOVIDADES: roda todo dia sozinho no GitHub (veja
   .github/workflows/radar.yml), busca notícias e assuntos em alta e
   grava tudo em radar/novidades.json. O painel lê esse arquivo.
   Não usa chave nem senha: só feeds públicos (Google Notícias e
   Google Trends). Para mudar os assuntos, edite a lista FONTES abaixo.
   ===================================================================== */
import { readFile, writeFile } from "node:fs/promises";

const ARQUIVO = new URL("./novidades.json", import.meta.url);
const DIAS_GUARDADOS = 14;
const MAX_POR_FONTE = 12;
const MAX_TOTAL = 500;

const noticias = q => ({
  tipo: "noticias",
  url: "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=pt-BR&gl=BR&ceid=BR:pt-419"
});

/* categoria: nome do filtro no painel */
const FONTES = [
  { categoria: "Em alta no Brasil", tipo: "trends", url: "https://trends.google.com/trending/rss?geo=BR" },
  { categoria: "Instagram", ...noticias("Instagram novidade OR novo recurso OR algoritmo when:3d") },
  { categoria: "TikTok", ...noticias("TikTok novidade OR tendência OR trend when:3d") },
  { categoria: "Criadores e UGC", ...noticias("UGC OR \"criadores de conteúdo\" OR influenciadores when:7d") },
  { categoria: "Beleza e skincare", ...noticias("tendência beleza OR skincare OR maquiagem lançamento when:3d") },
  { categoria: "Casa e achadinhos", ...noticias("achadinhos OR \"organização da casa\" OR Shopee tendência when:3d") },
  { categoria: "Tecnologia e apps", ...noticias("novo app OR inteligência artificial ferramenta criadores when:2d") }
];

const ENTIDADES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };
function limpar(t) {
  return String(t || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, m => ENTIDADES[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, " ")
    .trim();
}
function tag(bloco, nome) {
  const m = bloco.match(new RegExp("<" + nome + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + nome + ">", "i"));
  return m ? limpar(m[1]) : "";
}
function itens(xml) {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []);
}

/* Data de hoje no horário de Brasília, como AAAA-MM-DD */
function hoje() {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}
function isoOuNada(s) {
  const d = new Date(s);
  return isNaN(d) ? "" : d.toISOString();
}

async function baixar(url) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (radar-de-novidades)" }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.text();
}

function lerNoticias(xml, categoria) {
  return itens(xml).slice(0, MAX_POR_FONTE).map(b => {
    const fonte = tag(b, "source");
    let titulo = tag(b, "title");
    if (fonte && titulo.endsWith(" - " + fonte)) titulo = titulo.slice(0, -(fonte.length + 3));
    return { categoria, titulo, link: tag(b, "link"), fonte, pub: isoOuNada(tag(b, "pubDate")), resumo: "" };
  }).filter(x => x.titulo && x.link);
}

function lerTrends(xml, categoria) {
  return itens(xml).slice(0, MAX_POR_FONTE).map(b => {
    const titulo = tag(b, "title");
    const volume = tag(b, "ht:approx_traffic");
    const noticia = b.match(/<ht:news_item>[\s\S]*?<\/ht:news_item>/i);
    const nTitulo = noticia ? tag(noticia[0], "ht:news_item_title") : "";
    const nLink = noticia ? tag(noticia[0], "ht:news_item_url") : "";
    const nFonte = noticia ? tag(noticia[0], "ht:news_item_source") : "";
    return {
      categoria, titulo,
      link: nLink || "https://www.google.com/search?q=" + encodeURIComponent(titulo),
      fonte: nFonte || "Google Trends",
      pub: isoOuNada(tag(b, "pubDate")),
      resumo: [volume ? volume + " buscas" : "", nTitulo].filter(Boolean).join(" · ")
    };
  }).filter(x => x.titulo);
}

async function main() {
  let antigo = { atualizado_em: "", itens: [] };
  try { antigo = JSON.parse(await readFile(ARQUIVO, "utf8")); } catch (e) { /* primeira vez */ }

  const dia = hoje();
  const novos = [];
  const erros = [];
  for (const f of FONTES) {
    try {
      const xml = await baixar(f.url);
      const lista = f.tipo === "trends" ? lerTrends(xml, f.categoria) : lerNoticias(xml, f.categoria);
      lista.forEach(x => novos.push({ ...x, dia }));
      console.log(f.categoria + ": " + lista.length);
    } catch (e) {
      erros.push(f.categoria + ": " + e.message);
      console.log("Falhou " + f.categoria + ": " + e.message);
    }
  }
  if (!novos.length) throw new Error("Nenhuma fonte respondeu. " + erros.join(" | "));

  /* Junta com o que já existia, sem repetir (mesma categoria e mesmo link/título) */
  const chave = x => x.categoria + "|" + (x.categoria === "Em alta no Brasil" ? x.titulo + "|" + x.dia : x.link);
  const mapa = new Map();
  (antigo.itens || []).forEach(x => mapa.set(chave(x), x));
  novos.forEach(x => { const k = chave(x); mapa.set(k, mapa.has(k) ? { ...x, dia: mapa.get(k).dia } : x); });

  const limite = new Date(Date.now() - DIAS_GUARDADOS * 86400 * 1000).toISOString().slice(0, 10);
  const todos = [...mapa.values()]
    .filter(x => (x.dia || "") >= limite)
    .sort((a, b) => (b.dia || "").localeCompare(a.dia || "") || (b.pub || "").localeCompare(a.pub || ""))
    .slice(0, MAX_TOTAL);

  await writeFile(ARQUIVO, JSON.stringify({ atualizado_em: new Date().toISOString(), itens: todos }, null, 1) + "\n");
  console.log("Total guardado: " + todos.length);
}

main().catch(e => { console.error(e); process.exit(1); });
