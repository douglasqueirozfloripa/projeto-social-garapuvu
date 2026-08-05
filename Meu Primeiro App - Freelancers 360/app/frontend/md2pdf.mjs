// md2pdf.mjs — Converte o Guia (Markdown) em PDF com o Chromium do Playwright.
// Estilo "modelo v2": hero verde com selo, barras de seção numeradas, caixas de PROMPT
// creme, terminais escuros, callouts coloridos (✔ verde, 🏗️ âmbar, ⚠️ alerta, ℹ️ azul),
// rodapé com "Página X / Y". Uso (de dentro de frontend/): node md2pdf.mjs <in.md> <out.pdf>
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { chromium } from "@playwright/test";

const [, , mdPath, pdfPath] = process.argv;
if (!mdPath || !pdfPath) { console.error("uso: node md2pdf.mjs <entrada.md> <saida.pdf>"); process.exit(1); }

const src = readFileSync(mdPath, "utf8");

// ---- inline: `code`, **bold**, _italic_, [txt](url) ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_([^_\n]+?)_(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// Bloco interno (dentro de callouts): listas + texto.
function renderInner(L) {
  let out = "", j = 0; const textBuf = [];
  const flushText = () => { if (textBuf.length) { out += `<p>${textBuf.map(inline).join("<br/>")}</p>`; textBuf.length = 0; } };
  while (j < L.length) {
    if (/^\s*\d+\.\s+/.test(L[j])) {
      flushText(); const items = [];
      while (j < L.length && /^\s*\d+\.\s+/.test(L[j])) { items.push(L[j].replace(/^\s*\d+\.\s+/, "")); j++; }
      out += "<ol>" + items.map((it) => `<li>${inline(it)}</li>`).join("") + "</ol>";
    } else if (/^\s*-\s+/.test(L[j])) {
      flushText(); const items = [];
      while (j < L.length && /^\s*-\s+/.test(L[j])) { items.push(L[j].replace(/^\s*-\s+/, "")); j++; }
      out += "<ul>" + items.map((it) => `<li>${inline(it)}</li>`).join("") + "</ul>";
    } else { textBuf.push(L[j]); j++; }
  }
  flushText();
  return out;
}

// Classe do callout conforme o emoji inicial.
function quoteClass(text) {
  const t = text.trimStart();
  if (t.startsWith("🏗")) return "build";
  if (t.startsWith("✔") || t.startsWith("✅") || t.startsWith("🎯")) return "ok";
  if (t.startsWith("⚠") || t.startsWith("🧭")) return "warn";
  return "info";
}

// Divide "1 · Título" / "5.3 · Título" em { num, rest }.
function splitNum(text) {
  const m = text.match(/^(\d+(?:\.\d+)?)\s*·\s*(.*)$/);
  return m ? { num: m[1], rest: m[2] } : { num: null, rest: text };
}

const lines = src.split("\n");
let html = "";
let i = 0;

// ---- HERO: primeiro "# " + linhas seguintes até o primeiro "---" ----
while (i < lines.length && /^\s*$/.test(lines[i])) i++;
if (i < lines.length && /^#\s+/.test(lines[i])) {
  let titulo = lines[i].replace(/^#\s+/, ""); i++;
  // Marca de versão no final do título (ex.: "... Copilot v7") vira selo dourado.
  titulo = inline(titulo).replace(/\s(v\d+)\s*$/i, ' <span class="hero-ver">$1</span>');
  const sub = [];
  while (i < lines.length && !/^---+\s*$/.test(lines[i])) { if (lines[i].trim()) sub.push(lines[i]); i++; }
  if (i < lines.length) i++; // pula o ---
  html += `<div class="hero">
    <div class="hero-badge">✿</div>
    <h1 class="hero-title">${titulo}</h1>
    <div class="hero-sub">${sub.map(inline).join("<br/>")}</div>
  </div>`;
}

while (i < lines.length) {
  const line = lines[i];

  // bloco de código / prompt / terminal
  if (/^```/.test(line)) {
    const lang = line.replace(/^```/, "").trim(); i++;
    const code = [];
    while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
    i++;
    if (lang === "prompt") {
      html += `<pre class="prompt"><code>${esc(code.join("\n"))}</code></pre>`;
    } else {
      html += `<pre class="code${lang ? " lang-" + lang : ""}"><code>${esc(code.join("\n"))}</code></pre>`;
    }
    continue;
  }

  // tabela
  if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
    const parseRow = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const head = parseRow(line); i += 2;
    const rows = [];
    while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(parseRow(lines[i])); i++; }
    html += "<table><thead><tr>" + head.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>";
    html += rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("");
    html += "</tbody></table>";
    continue;
  }

  // headings
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    const lvl = h[1].length;
    const { num, rest } = splitNum(h[2]);
    if (lvl === 2) {
      html += `<h2 class="section">${num ? `<span class="section-num">${num}</span>` : ""}<span>${inline(rest)}</span></h2>`;
    } else if (lvl === 3) {
      // "### Fase N — ..." vira barra escura de fase; demais h3 são subtítulos.
      if (/^Fase\b/i.test(rest)) html += `<h3 class="fase">${inline(rest)}</h3>`;
      else html += `<h3 class="sub">${num ? `<span class="sub-num">${num}</span> ` : ""}${inline(rest)}</h3>`;
    } else if (lvl === 4 && /^PROMPT\b/i.test(h[2])) {
      html += `<h4 class="prompt-title">${inline(h[2])}</h4>`;
    } else {
      html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
    }
    i++; continue;
  }

  // hr
  if (/^---+\s*$/.test(line)) { html += "<hr/>"; i++; continue; }

  // blockquote / callout
  if (/^>\s?/.test(line)) {
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
    const cls = quoteClass(buf.join(" "));
    html += `<blockquote class="quote ${cls}">${renderInner(buf)}</blockquote>`;
    continue;
  }

  // listas
  if (/^\s*-\s+/.test(line)) {
    const buf = [];
    while (i < lines.length && /^\s*-\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*-\s+/, "")); i++; }
    html += "<ul>" + buf.map((li) => `<li>${inline(li)}</li>`).join("") + "</ul>";
    continue;
  }
  if (/^\s*\d+\.\s+/.test(line)) {
    const buf = [];
    while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
    html += "<ol>" + buf.map((li) => `<li>${inline(li)}</li>`).join("") + "</ol>";
    continue;
  }

  // linha em branco
  if (/^\s*$/.test(line)) { i++; continue; }

  // parágrafo
  const buf = [line]; i++;
  while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|>|```|\s*-\s|\s*\d+\.\s|\s*\|)/.test(lines[i])) { buf.push(lines[i]); i++; }
  html += `<p>${inline(buf.join(" "))}</p>`;
}

const doc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @page { margin: 15mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #23302a; font-size: 12px; line-height: 1.55; }

  /* Hero */
  .hero { background: #14401A; color: #fff; border-radius: 16px; padding: 26px 30px; margin: 0 0 20px; page-break-inside: avoid; }
  .hero-badge { width: 46px; height: 46px; border-radius: 50%; background: #F2B705; color: #14401A; font-size: 24px; line-height: 46px; text-align: center; margin-bottom: 14px; }
  .hero-title { font-size: 30px; font-weight: 800; margin: 0 0 12px; color: #fff; }
  .hero-ver { color: #F2B705; font-size: 18px; font-weight: 800; vertical-align: super; }
  .hero-sub { font-size: 12.5px; color: #cfe3d2; line-height: 1.6; }
  .hero-sub strong { color: #fff; }

  /* Seções (h2) como barra verde com número */
  h2.section { background: #1f6b2e; color: #fff; border-radius: 9px; padding: 10px 14px; font-size: 16px; margin: 26px 0 12px; display: flex; align-items: center; gap: 11px; page-break-after: avoid; }
  .section-num { background: #F2B705; color: #14401A; min-width: 26px; height: 26px; border-radius: 7px; font-weight: 800; font-size: 14px; text-align: center; line-height: 26px; flex: none; padding: 0 4px; }
  /* Fases (h3) como barra verde-escura com destaque dourado no "Fase N" */
  h3.fase { background: #14401A; color: #fff; border-radius: 8px; padding: 9px 14px; font-size: 14.5px; margin: 22px 0 12px; page-break-after: avoid; }
  h3.sub { color: #1f6b2e; font-size: 14px; margin: 18px 0 6px; page-break-after: avoid; }
  .sub-num { background: #e7f0e8; color: #1f6b2e; border-radius: 5px; padding: 0 6px; font-size: 12.5px; }
  h4 { color: #1f6b2e; font-size: 12.5px; margin: 12px 0 4px; }
  /* Título de PROMPT (olive, caixa-alta) */
  h4.prompt-title { color: #6b6a17; font-size: 11px; letter-spacing: .04em; font-weight: 800; margin: 14px 0 0; text-transform: uppercase; }

  p { margin: 7px 0; }
  a { color: #1f6b2e; text-decoration: none; }
  code { background: #eef3ee; color: #14401A; padding: 1px 5px; border-radius: 4px; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 11px; }

  /* Terminal / comandos: caixa escura */
  pre.code { background: #14401A; color: #eafbe9; padding: 12px 15px; border-radius: 9px; overflow-x: auto; page-break-inside: avoid; }
  pre.code code { background: transparent; color: inherit; padding: 0; font-size: 10.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }

  /* Caixa de PROMPT: creme com borda dourada à esquerda */
  pre.prompt { background: #fdf9ec; border: 1px solid #ecdca0; border-left: 5px solid #F2B705; color: #33320f; padding: 11px 15px; border-radius: 9px; overflow-x: auto; margin: 4px 0 12px; page-break-inside: avoid; }
  pre.prompt code { background: transparent; color: inherit; padding: 0; font-size: 10.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; font-family: "SF Mono", Menlo, Consolas, monospace; }

  /* Callouts coloridos */
  blockquote.quote { border-radius: 9px; padding: 10px 15px; margin: 12px 0; border-left: 5px solid; page-break-inside: avoid; }
  blockquote.quote p { margin: 5px 0; }
  blockquote.quote p:first-child { margin-top: 0; }
  blockquote.quote p:last-child { margin-bottom: 0; }
  .quote.ok    { background: #eef7ee; border-color: #2e7d32; }
  .quote.build { background: #fdf3dd; border-color: #F2B705; }
  .quote.warn  { background: #fdecea; border-color: #d9534f; }
  .quote.info  { background: #eaf2fb; border-color: #2f6db3; }

  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 11px; page-break-inside: avoid; }
  th, td { border: 1px solid #cfe0d3; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #14401A; color: #fff; }
  tr:nth-child(even) td { background: #f4f8f4; }

  ul, ol { margin: 6px 0; padding-left: 24px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #d9e4dc; margin: 20px 0; }
</style></head><body>${html}</body></html>`;

const htmlPath = pdfPath.replace(/\.pdf$/i, "") + ".html";
writeFileSync(htmlPath, doc, "utf8");

const footer = `<div style="width:100%;font-size:8px;color:#9aa5a0;padding:0 14mm;
     display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;">
  <span>Projeto Social Garapuvu 2026 &middot; Guia de Prompts do GitHub Copilot</span>
  <span>Página <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(doc, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: footer,
  margin: { top: "15mm", bottom: "18mm", left: "14mm", right: "14mm" },
});
await browser.close();
try { unlinkSync(htmlPath); } catch {}
console.log("PDF gerado:", pdfPath);
