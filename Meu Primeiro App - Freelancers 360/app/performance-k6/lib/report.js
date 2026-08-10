// lib/report.js — GERAÇÃO DE RELATÓRIO HTML a partir do resumo do k6.
//
// O k6 chama a função exportada `handleSummary(data)` no FIM do teste. O que
// ela devolver é um mapa { "caminho/do/arquivo": conteudo } — o k6 escreve cada
// arquivo em disco. A chave especial "stdout" é impressa no terminal.
//
// Aqui montamos um HTML autocontido (CSS embutido, sem CDN, abre offline), com
// as CORES DO PROJETO GARAPUVU, contendo:
//   - veredito do QUALITY GATE (aprovado/reprovado);
//   - cartões com os números principais (KPIs);
//   - tabela de thresholds (esperado x obtido);
//   - gráfico do tempo de resposta;
//   - tabela de checks (asserts);
//   - métricas customizadas + métricas padrão;
//   - GLOSSÁRIO: explicação em português de cada métrica + link de referência.
//
// Uso em qualquer script de teste:
//   import { relatorio } from "./lib/report.js";
//   export function handleSummary(data) { return relatorio(data, "smoke"); }

// Design tokens de cor (paleta em 2 níveis). Trocar o tema não muda o relatório,
// só as cores. Escolha o tema com:  k6 run -e TEMA=oceano load.js
import { cssTokens, TEMAS, TEMA_PADRAO } from "./tokens.js";

// Lê o tema do ambiente (se houver) ou usa o padrão (garapuvu). O typeof evita
// erro quando este arquivo roda fora do k6 (ex.: ao regerar relatórios no Node).
const TEMA =
  (typeof __ENV !== "undefined" && __ENV.TEMA) ||
  (typeof process !== "undefined" && process.env && process.env.TEMA) ||
  TEMA_PADRAO;

// Estatísticas que o k6 calcula para métricas do tipo Trend no resumo final.
// O padrão do k6 NÃO inclui p(99) — sem isto, um threshold "p(99)<1500" até
// funciona, mas o relatório não teria o valor obtido para exibir. Use assim:
//   export const options = { summaryTrendStats: TREND_STATS, ... }
export const TREND_STATS = ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"];

// ---------- Links de referência (documentação oficial do k6) ----------
const REF = {
  metrics: "https://grafana.com/docs/k6/latest/using-k6/metrics/reference/",
  custom: "https://grafana.com/docs/k6/latest/using-k6/metrics/create-custom-metrics/",
  thresholds: "https://grafana.com/docs/k6/latest/using-k6/thresholds/",
  checks: "https://grafana.com/docs/k6/latest/using-k6/checks/",
  scenarios: "https://grafana.com/docs/k6/latest/using-k6/scenarios/",
  fim: "https://grafana.com/docs/k6/latest/results-output/end-of-test/",
};

// ---------- Glossário: o que cada métrica significa (em PT) ----------
// titulo   = nome amigável   · desc = o que a métrica mede
// analisar = como interpretar (o "ponto a analisar") · link = referência
const DICIONARIO = {
  http_reqs: { titulo: "Requisições HTTP (total)", desc: "Quantidade total de requisições HTTP disparadas no teste.", analisar: "Serve para medir a vazão (throughput). Combine com a taxa (req/s) para saber quanto a API aguenta por segundo.", link: REF.metrics },
  http_req_duration: { titulo: "Tempo de resposta (duração total)", desc: "Tempo completo de cada requisição: enviar + esperar + receber. É a métrica-rainha de tempo de resposta.", analisar: "Olhe o p(95) e o p(99), NÃO a média — a média esconde os usuários mais lentos. Compare com o SLA acordado.", estudar: "Para estudar: p(95) alto com 0% de erro significa que a API respondeu tudo, só que devagar. O gargalo aparece em http_req_waiting (TTFB) — se ele domina a duração, o problema é processamento no backend/banco, não rede. Compare o p(95) do gate-exigente (50 VUs) com o do custom-quality-gate (10 VUs) para ver a latência crescer com a concorrência.", link: REF.metrics },
  http_req_failed: { titulo: "Taxa de falha", desc: "Proporção de requisições que falharam (status 4xx/5xx ou erro de rede).", analisar: "Principal termômetro de saúde. Ideal < 1%. Erros que surgem só sob carga indicam gargalo ou instabilidade.", estudar: "Para estudar: se esta métrica está em 0% e mesmo assim o build reprovou, o problema NÃO é disponibilidade. Um gate bem feito barra por lentidão e por requisito faltando, sem precisar que nada caia.", link: REF.metrics },
  http_req_waiting: { titulo: "TTFB — espera do servidor", desc: "Time To First Byte: tempo aguardando o servidor processar, depois que o pedido foi enviado.", analisar: "É o tempo de processamento no backend/banco. Se cresce junto com a carga, o gargalo está no servidor.", link: REF.metrics },
  http_req_blocked: { titulo: "Tempo bloqueado", desc: "Tempo parado ANTES de iniciar a requisição (fila de conexões, resolução de DNS).", analisar: "Alto e crescente sugere esgotamento do pool de conexões ou DNS lento.", link: REF.metrics },
  http_req_connecting: { titulo: "Conexão TCP", desc: "Tempo estabelecendo a conexão TCP com o servidor.", analisar: "Costuma ser baixo; se sobe, pode ser rede ou o servidor recusando conexões sob carga.", link: REF.metrics },
  http_req_tls_handshaking: { titulo: "Handshake TLS", desc: "Tempo negociando a criptografia TLS (só em HTTPS).", analisar: "Relevante em HTTPS; reaproveitar conexões (keep-alive) reduz este custo.", link: REF.metrics },
  http_req_sending: { titulo: "Envio do request", desc: "Tempo enviando os bytes da requisição ao servidor.", analisar: "Alto só com payloads grandes de upload. Normalmente próximo de zero.", link: REF.metrics },
  http_req_receiving: { titulo: "Recebimento da resposta", desc: "Tempo baixando os bytes da resposta do servidor.", analisar: "Alto pode indicar respostas grandes demais (falta de paginação, payload gordo).", link: REF.metrics },
  iterations: { titulo: "Iterações (fluxos completos)", desc: "Quantas vezes a função default rodou do início ao fim.", analisar: "Cada iteração é um 'usuário completando o roteiro'. Mais iterações = mais cenários exercitados.", link: REF.scenarios },
  iteration_duration: { titulo: "Duração da iteração", desc: "Tempo de uma iteração inteira — INCLUINDO os sleep() de think time.", analisar: "Útil para dimensionar VUs. Não confunda com http_req_duration (esta inclui as pausas).", link: REF.scenarios },
  vus: { titulo: "Usuários virtuais ativos", desc: "Quantos VUs estavam rodando naquele instante.", analisar: "Deve seguir a curva de stages (rampage). Serve para cruzar carga x tempo de resposta.", link: REF.scenarios },
  vus_max: { titulo: "Pico de usuários virtuais", desc: "Maior número de VUs alocados durante o teste.", analisar: "É o teto de concorrência que você simulou. Compare com o tráfego real esperado em produção.", link: REF.scenarios },
  data_sent: { titulo: "Dados enviados", desc: "Total de bytes enviados pelos VUs ao servidor.", analisar: "Ajuda a estimar consumo de banda e custo de rede.", link: REF.metrics },
  data_received: { titulo: "Dados recebidos", desc: "Total de bytes recebidos do servidor.", analisar: "Respostas muito grandes elevam este número — sinal para paginar ou comprimir.", link: REF.metrics },
  checks: { titulo: "Checks (asserts) aprovados", desc: "Proporção de verificações check() que passaram.", analisar: "Mede correção funcional SOB carga. Ideal > 99%. Quedas indicam respostas erradas quando a app aperta.", estudar: "Para estudar: check falhando NÃO é lentidão, é resposta errada ou requisito faltando. No gate-exigente, os 20% de falha vêm de um único assert que cobra o campo 'prazo' — funcionalidade que a API não implementa. Lembre: o check sozinho não reprova nada; quem reprova é o threshold checks: [\"rate==1.00\"].", link: REF.checks },
  dropped_iterations: { titulo: "Iterações descartadas", desc: "Iterações que o k6 planejou mas NÃO conseguiu executar (faltou VU / arrival-rate).", analisar: "Se aparece, o sistema não deu conta do ritmo pedido — é um sinal de saturação.", link: REF.scenarios },
  group_duration: { titulo: "Duração de grupos", desc: "Tempo gasto dentro de blocos group().", analisar: "Ajuda a isolar qual etapa do fluxo (grupo) está mais lenta.", link: REF.metrics },
  // ---- métricas customizadas deste projeto ----
  fluxo_negocio_duracao: { titulo: "Duração do fluxo de negócio (custom)", desc: "Tempo fim-a-fim do cenário completo (cadastro → login → criar projeto).", analisar: "É a experiência real do usuário. Foque no p(95): 95% das pessoas esperam menos que este tempo.", estudar: "Para estudar: é a experiência real de ponta a ponta (cadastro → login → criar projeto), somando as três requisições. Por isso estoura antes de cada requisição isolada estourar — o usuário sente a soma, não a média de cada pedaço.", link: REF.custom },
  login_sucesso: { titulo: "Taxa de sucesso de login (custom)", desc: "Proporção de logins bem-sucedidos durante o teste.", analisar: "Métrica de negócio: login falhando sob carga afasta usuários. Alvo > 98%.", estudar: "Para estudar: taxa de login é métrica de NEGÓCIO. Se cair sob carga enquanto http_req_failed segue baixo, a API está respondendo 200 com conteúdo errado — pior que um erro explícito, porque passa despercebido.", link: REF.custom },
  projetos_criados: { titulo: "Projetos criados (custom)", desc: "Contador de projetos criados com sucesso no teste.", analisar: "Confirma que a escrita (não só a leitura) aguentou a carga.", estudar: "Para estudar: Counter reprovando por count baixo quase nunca é culpa da aplicação — é meta de volume incompatível com a duração do teste, ou o teste foi abortado antes do fim pelo abortOnFail. Confira a duração real no cabeçalho do relatório antes de culpar a API.", link: REF.custom },
};

// Texto de estudo genérico, usado quando a métrica reprovada não tem um
// "estudar" próprio no DICIONARIO acima.
const ESTUDO_PADRAO =
  "Para estudar: compare o valor obtido com o critério acordado e decida qual dos dois muda. " +
  "Ou a aplicação melhora (otimização, cache, índice no banco), ou o critério estava irreal e precisa ser renegociado com o time.";

// Ordem de exibição no glossário (as mais importantes primeiro).
const ORDEM_GUIA = [
  "http_req_duration", "http_req_failed", "http_reqs", "checks",
  "fluxo_negocio_duracao", "login_sucesso", "projetos_criados",
  "http_req_waiting", "http_req_blocked", "http_req_connecting",
  "http_req_tls_handshaking", "http_req_sending", "http_req_receiving",
  "iterations", "iteration_duration", "vus", "vus_max",
  "data_sent", "data_received", "dropped_iterations", "group_duration",
];

// ---------- Helpers de formatação ----------

const ehTempo = (m) => m && m.contains === "time";

function num(v, casas = 2) {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return Number(v).toFixed(casas).replace(/\.00$/, "");
}

function ms(v) {
  if (v === undefined || v === null) return "—";
  return v >= 1000 ? `${num(v / 1000)} s` : `${num(v)} ms`;
}

function bytes(v) {
  if (v === undefined || v === null) return "—";
  if (v >= 1e6) return `${num(v / 1e6)} MB`;
  if (v >= 1e3) return `${num(v / 1e3)} kB`;
  return `${num(v, 0)} B`;
}

function pct(v) {
  if (v === undefined || v === null) return "—";
  return `${num(v * 100)}%`;
}

function duracao(msTotal) {
  const s = Math.round(msTotal / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Escapa texto antes de injetar no HTML (nomes de check vêm do teste).
function esc(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Formata o valor de uma métrica respeitando o tipo (tempo → ms/s).
function valor(metrica, chave) {
  const v = metrica.values[chave];
  if (v === undefined) return "—";
  if (chave === "rate") return pct(v);
  return ehTempo(metrica) ? ms(v) : num(v, chave === "count" || chave === "passes" ? 0 : 2);
}

// Um "valor-resumo" de UMA métrica, para mostrar ao lado da explicação no
// glossário (conecta o conceito ao número DESTE teste).
function valorResumo(nome, m) {
  if (!m) return "—";
  if (nome === "data_sent" || nome === "data_received") return bytes(m.values.count);
  if (m.type === "trend") return `p(95) ${ms(m.values["p(95)"])} · avg ${ms(m.values.avg)}`;
  if (m.type === "rate") return pct(m.values.rate);
  if (m.type === "counter") return `${num(m.values.count, 0)}${m.values.rate !== undefined ? ` · ${num(m.values.rate, 1)}/s` : ""}`;
  return num(m.values.value ?? m.values.max, 2);
}

// Nome da métrica como LINK para a referência (se houver no dicionário).
function linkNome(nome) {
  const d = DICIONARIO[nome];
  if (d && d.link) return `<a href="${d.link}" target="_blank" rel="noreferrer" title="${esc(d.desc)}"><code>${esc(nome)}</code></a>`;
  return `<code>${esc(nome)}</code>`;
}

// ---------- Leitura do resumo ----------

// Um threshold é uma string tipo "p(95)<800". Separamos a estatística ("p(95)")
// para conseguir mostrar o valor REALMENTE obtido ao lado do esperado.
function estatisticaDo(expressao) {
  const m = String(expressao).match(/^\s*([a-zA-Z0-9_().]+)\s*[<>=!]/);
  return m ? m[1] : null;
}

// Quantas observações caíram no lado RUIM da métrica, em números absolutos
// ("1200 de 6000" diz muito mais que "80%").
//
// Só existe para métricas do tipo `rate` — são as que contam sucesso/falha uma
// a uma. Em `trend` (percentis) e `counter` o resumo do k6 não guarda quantas
// observações passaram do limite, então devolvemos null e a coluna mostra "—".
//
// PEGADINHA do k6: numa Rate, `passes` é a contagem de valores `true`. Em
// `http_req_failed` o `true` significa "a requisição FALHOU", então ali o lado
// ruim é `passes`. Nas outras rates (checks, rates customizadas) o `true` é
// sucesso e o lado ruim é `fails`.
function contagemFalhas(nome, metrica) {
  if (metrica.type !== "rate") return null;
  const { passes, fails } = metrica.values;
  if (passes === undefined || fails === undefined) return null;
  return { ruins: nome === "http_req_failed" ? passes : fails, total: passes + fails };
}

function coletarThresholds(metrics) {
  const linhas = [];
  for (const [nome, metrica] of Object.entries(metrics)) {
    if (!metrica.thresholds) continue;
    for (const [expr, res] of Object.entries(metrica.thresholds)) {
      const stat = estatisticaDo(expr);
      linhas.push({
        metrica: nome,
        esperado: expr,
        obtido:
          stat && metrica.values[stat] === undefined
            ? "não coletado"
            : stat
            ? valor(metrica, stat)
            : "—",
        falhas: contagemFalhas(nome, metrica),
        ok: res.ok !== false,
      });
    }
  }
  return linhas;
}

// Os checks vêm em árvore (root_group → groups → checks). Achatamos tudo.
function coletarChecks(grupo, prefixo = "", saida = []) {
  if (!grupo) return saida;
  for (const c of grupo.checks || []) {
    saida.push({ nome: prefixo + c.name, passes: c.passes, fails: c.fails });
  }
  for (const g of grupo.groups || []) {
    coletarChecks(g, `${prefixo}${g.name} › `, saida);
  }
  return saida;
}

// Métricas que o k6 já traz de fábrica — o resto é customizado (do teste).
const PADRAO = /^(http_req_|http_reqs|https?_|vus|vus_max|iterations|iteration_duration|data_sent|data_received|checks|dropped_iterations|group_duration)/;

// ---------- Blocos de HTML ----------

function cartao(rotulo, valorTexto, estado = "") {
  return `<div class="kpi ${estado}"><span class="kpi-v">${valorTexto}</span><span class="kpi-r">${esc(rotulo)}</span></div>`;
}

// Caixa de destaque no topo quando o gate reprova: quem falhou e por quanto.
function caixaFalhas(gates, checks) {
  const gatesRuins = gates.filter((g) => !g.ok);
  const checksRuins = checks.filter((c) => c.fails > 0);
  if (!gatesRuins.length && !checksRuins.length) return "";

  const itensGate = gatesRuins
    .map((g) => `<li><code>${esc(g.metrica)}</code> exigia <code>${esc(g.esperado)}</code> — obteve <b>${esc(g.obtido)}</b></li>`)
    .join("");
  const itensCheck = checksRuins
    .map((c) => `<li>“${esc(c.nome)}” falhou <b>${c.fails}</b> de ${c.passes + c.fails} vezes</li>`)
    .join("");

  return `<div class="alerta-box">
    <strong>Por que o build foi barrado</strong>
    ${gatesRuins.length ? `<p>Thresholds violados (${gatesRuins.length} de ${gates.length}):</p><ul>${itensGate}</ul>` : ""}
    ${itensCheck ? `<p>Asserts com falha:</p><ul>${itensCheck}</ul>` : ""}
  </div>`;
}

// Célula da coluna "Falhas": "1200 de 6000", ou "—" quando a métrica não conta
// sucesso/falha (o title explica o porquê para quem passar o mouse).
function celulaFalhas(f) {
  if (!f) return `<span class="na" title="Métrica de percentil/contagem: o resumo do k6 não informa quantas observações violaram o limite.">—</span>`;
  if (!f.ruins) return `<span class="suave">0 de ${num(f.total, 0)}</span>`;
  return `<b>${num(f.ruins, 0)}</b> de ${num(f.total, 0)}`;
}

function tabelaThresholds(linhas) {
  if (!linhas.length) return `<p class="vazio">Este teste não definiu thresholds.</p>`;
  const trs = linhas
    .map(
      (l) => `<tr class="${l.ok ? "ok" : "falha"}">
      <td>${l.ok ? "✓" : "✗"}</td>
      <td>${linkNome(l.metrica)}</td>
      <td><code>${esc(l.esperado)}</code></td>
      <td class="n">${esc(l.obtido)}</td>
      <td class="n">${celulaFalhas(l.falhas)}</td>
      <td>${l.ok ? "aprovado" : "REPROVADO"}</td>
    </tr>`
    )
    .join("");
  return `<table><thead><tr><th></th><th>Métrica</th><th>Critério (esperado)</th><th>Obtido</th><th title="Observações no lado ruim da métrica. Só métricas de taxa (rate) guardam essa contagem.">Falhas</th><th>Resultado</th></tr></thead><tbody>${trs}</tbody></table>`;
}

function tabelaChecks(checks) {
  if (!checks.length) return `<p class="vazio">Nenhum check registrado.</p>`;
  const trs = checks
    .map((c) => {
      const total = c.passes + c.fails;
      const taxa = total ? c.passes / total : 0;
      return `<tr class="${c.fails ? "falha" : "ok"}">
      <td>${c.fails ? "✗" : "✓"}</td>
      <td>${esc(c.nome)}</td>
      <td class="n">${c.passes}</td>
      <td class="n">${c.fails}</td>
      <td class="barra-cel"><div class="barra"><i style="width:${(taxa * 100).toFixed(1)}%"></i></div><span>${pct(taxa)}</span></td>
    </tr>`;
    })
    .join("");
  return `<table><thead><tr><th></th><th>Check (assert)</th><th>Passou</th><th>Falhou</th><th>Taxa</th></tr></thead><tbody>${trs}</tbody></table>`;
}

function tabelaMetricas(metrics, filtro) {
  const nomes = Object.keys(metrics).filter(filtro).sort();
  if (!nomes.length) return `<p class="vazio">Nenhuma métrica nesta categoria.</p>`;
  const trs = nomes
    .map((nome) => {
      const m = metrics[nome];
      const vs = m.values;
      const resumo =
        m.type === "trend"
          ? `avg ${ms(vs.avg)} · med ${ms(vs.med)} · p90 ${ms(vs["p(90)"])} · <b>p95 ${ms(vs["p(95)"])}</b> · max ${ms(vs.max)}`
          : m.type === "rate"
          ? `<b>${pct(vs.rate)}</b> — ${num(vs.passes, 0)} de ${num(vs.passes + vs.fails, 0)} observações`
          : m.type === "counter"
          ? `<b>${num(vs.count, 0)}</b>${vs.rate !== undefined ? ` · ${num(vs.rate)}/s` : ""}`
          : `<b>${num(vs.value, 2)}</b> · min ${num(vs.min, 2)} · max ${num(vs.max, 2)}`;
      return `<tr><td>${linkNome(nome)}</td><td class="tipo">${m.type}</td><td>${resumo}</td></tr>`;
    })
    .join("");
  return `<table><thead><tr><th>Métrica</th><th>Tipo</th><th>Valores</th></tr></thead><tbody>${trs}</tbody></table>`;
}

// GLOSSÁRIO: um cartão por métrica presente no teste, com explicação em PT,
// o "ponto a analisar" e o link de referência. É a estrela pedida para a aula.
function guiaMetricas(metrics, gates = [], checks = []) {
  // Nomes com chaves são SUB-MÉTRICAS por tag ("http_req_duration{tipo:critico}",
  // "http_req_duration{expected_response:true}") — recortes da mesma métrica, não
  // métricas novas. Ficam fora do glossário: o cartão da métrica-mãe já explica o
  // conceito, e a falha de um recorte aparece nele com a linha "(escopo: ...)".
  const presentes = new Set(Object.keys(metrics).filter((n) => !n.includes("{")));

  // Índice: nome da métrica → thresholds violados por ela.
  // Um threshold pode vir com tag ("http_req_duration{tipo:critico}"); nesse
  // caso ele é indexado no nome exato E no nome-base, para que o cartão de
  // http_req_duration também mostre a falha da rota crítica.
  const falhasPorMetrica = {};
  const registrar = (chave, item) => {
    (falhasPorMetrica[chave] = falhasPorMetrica[chave] || []).push(item);
  };
  for (const g of gates.filter((x) => !x.ok)) {
    registrar(g.metrica, g);
    const base = g.metrica.split("{")[0];
    if (base !== g.metrica) registrar(base, g);
  }
  // Asserts com falha entram no cartão da métrica "checks" — é ela que os agrega.
  const checksRuins = checks.filter((c) => c.fails > 0);

  const cartaoReprovado = (nome) =>
    (falhasPorMetrica[nome] || []).length > 0 || (nome === "checks" && checksRuins.length > 0);

  // Ordena: métricas REPROVADAS primeiro (é o que o aluno precisa estudar),
  // depois a ordem didática, depois o resto em ordem alfabética.
  const ordenadas = ORDEM_GUIA.filter((n) => presentes.has(n))
    .concat([...presentes].filter((n) => !ORDEM_GUIA.includes(n)).sort())
    .sort((a, b) => (cartaoReprovado(b) ? 1 : 0) - (cartaoReprovado(a) ? 1 : 0));

  const itens = ordenadas
    .map((nome) => {
      const m = metrics[nome];
      const d = DICIONARIO[nome] || {
        titulo: nome, desc: "Métrica customizada definida no teste.",
        analisar: "Interprete conforme o objetivo do cenário.", link: REF.custom,
      };
      const custom = !PADRAO.test(nome);
      const reprovada = cartaoReprovado(nome);

      // Bloco vermelho de estudo: por que ESTA métrica barrou o build e o que
      // fazer com a informação. Só aparece quando a métrica realmente falhou.
      let motivo = "";
      if (reprovada) {
        const linhasGate = (falhasPorMetrica[nome] || [])
          .map(
            (g) =>
              `<li>exigia <code>${esc(g.esperado)}</code> · obteve <b>${esc(g.obtido)}</b>${
                g.metrica !== nome ? ` <span class="escopo">(escopo: <code>${esc(g.metrica)}</code>)</span>` : ""
              }</li>`
          )
          .join("");
        const linhasCheck =
          nome === "checks"
            ? checksRuins
                .map((c) => `<li>assert “${esc(c.nome)}” falhou <b>${c.fails}</b> de ${c.passes + c.fails} vezes</li>`)
                .join("")
            : "";
        motivo = `<div class="motivo">
          <span class="motivo-titulo">Esta métrica REPROVOU o build</span>
          <ul>${linhasGate}${linhasCheck}</ul>
          <p class="motivo-estudo">${esc(d.estudar || ESTUDO_PADRAO)}</p>
        </div>`;
      }

      return `<div class="item${custom ? " custom" : ""}${reprovada ? " reprovada" : ""}">
        <div class="item-top">
          <b>${esc(d.titulo)}</b>
          ${linkNome(nome)}
          <span class="tag">${custom ? "customizada" : "padrão k6"}</span>
          ${reprovada ? `<span class="selo-falha">✗ reprovou</span>` : ""}
          <span class="item-val">${valorResumo(nome, m)}</span>
        </div>
        <p>${esc(d.desc)}</p>
        <p class="analisar"><b>O que analisar:</b> ${esc(d.analisar)}</p>
        ${motivo}
        <a class="ref" href="${d.link}" target="_blank" rel="noreferrer">Referência oficial ↗</a>
      </div>`;
    })
    .join("");

  const nFalhas = ordenadas.filter(cartaoReprovado).length;
  const aviso = nFalhas
    ? `<p class="guia-aviso">Os <b>${nFalhas}</b> cartões em <b>vermelho</b> vêm primeiro: são as métricas que barraram
       este build. Leia o bloco “Esta métrica REPROVOU o build” de cada um — é o roteiro de estudo da
       <b>simulação de falha</b> (<code>gate-exigente.js</code>), ligando o número obtido ao critério acordado.</p>`
    : "";

  return `${aviso}<div class="guia">${itens}</div>`;
}

// Gráfico da distribuição do tempo de resposta — barras em HTML/CSS puro.
function graficoLatencia(dur) {
  if (!dur) return "";
  const pontos = [
    ["min", dur.values.min],
    ["med", dur.values.med],
    ["p(90)", dur.values["p(90)"]],
    ["p(95)", dur.values["p(95)"]],
    ["p(99)", dur.values["p(99)"]],
    ["max", dur.values.max],
  ].filter(([, v]) => typeof v === "number");
  if (!pontos.length) return "";
  const maxV = Math.max(...pontos.map(([, v]) => v)) || 1;
  const colunas = pontos
    .map(([rotulo, v]) => {
      const h = Math.max((v / maxV) * 100, 2);
      return `<div class="col${rotulo === "p(95)" ? " destaque" : ""}">
      <span class="col-v">${ms(v)}</span>
      <div class="col-trilho"><div class="col-barra" style="height:${h.toFixed(1)}%"></div></div>
      <span class="col-r">${rotulo}</span>
    </div>`;
    })
    .join("");
  return `<div class="grafico" role="img" aria-label="Distribuição do tempo de resposta">${colunas}</div>`;
}

// ---------- Resumo de texto para o terminal ----------
function resumoTexto(data, nome, gates, arquivoHtml) {
  const m = data.metrics;
  const reprovados = gates.filter((g) => !g.ok);
  const linhas = [
    "",
    `  RESUMO — ${nome}`,
    `  requisições .... ${m.http_reqs ? num(m.http_reqs.values.count, 0) : "—"}`,
    `  erros .......... ${m.http_req_failed ? pct(m.http_req_failed.values.rate) : "—"}`,
    `  p(95) .......... ${m.http_req_duration ? ms(m.http_req_duration.values["p(95)"]) : "—"}`,
    `  checks ......... ${m.checks ? pct(m.checks.values.rate) : "—"}`,
    `  quality gate ... ${reprovados.length ? `REPROVADO (${reprovados.map((g) => g.esperado).join(", ")})` : "APROVADO"}`,
    `  relatório ...... ${arquivoHtml}`,
    "",
  ];
  return linhas.join("\n");
}

// ---------- Função principal ----------

/**
 * Monta o relatório do teste.
 * @param {object} data  resumo entregue pelo k6 ao handleSummary
 * @param {string} nome  identificador do teste (vira o nome do arquivo)
 * @returns {object} mapa { caminho: conteudo } que o k6 grava em disco
 */
export function relatorio(data, nome = "k6") {
  const metrics = data.metrics || {};
  const gates = coletarThresholds(metrics);
  const checks = coletarChecks(data.root_group);
  const aprovado = gates.every((g) => g.ok);
  const arquivoHtml = `reports/${nome}.html`;

  const dur = metrics.http_req_duration;
  const reqs = metrics.http_reqs;
  const falhas = metrics.http_req_failed;
  const chk = metrics.checks;
  const duracaoMs = (data.state && data.state.testRunDurationMs) || 0;

  const kpis = [
    cartao("gate (thresholds ok)", gates.length ? `${gates.filter((g) => g.ok).length}/${gates.length}` : "—", aprovado ? "bom" : "ruim"),
    cartao("requisições", reqs ? num(reqs.values.count, 0) : "—"),
    cartao("req/s", reqs ? num(reqs.values.rate, 1) : "—"),
    cartao("taxa de erro", falhas ? pct(falhas.values.rate) : "—", !falhas ? "" : falhas.values.rate > 0.01 ? "ruim" : falhas.values.rate > 0 ? "alerta" : "bom"),
    cartao("p(95) resposta", dur ? ms(dur.values["p(95)"]) : "—"),
    cartao("resposta média", dur ? ms(dur.values.avg) : "—"),
    cartao("checks ok", chk ? pct(chk.values.rate) : "—", !chk ? "" : chk.values.rate < 0.99 ? "ruim" : chk.values.rate < 1 ? "alerta" : "bom"),
    cartao("VUs (pico)", metrics.vus_max ? num(metrics.vus_max.values.max ?? metrics.vus_max.values.value, 0) : "—"),
    cartao("iterações", metrics.iterations ? num(metrics.iterations.values.count, 0) : "—"),
  ].join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório k6 — ${esc(nome)}</title>
<style>
  /* ===== Design tokens de cor (gerados por lib/tokens.js — tema: ${esc(TEMA)}) ===== */
  ${cssTokens(TEMA)}
  *{box-sizing:border-box}
  body{margin:0;padding:0 20px 64px;min-height:100vh;color:var(--txt);background-color:var(--bg);
       font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  /* Imagem de fundo em uma CAMADA FIXA própria (body::before), atrás de tudo.
     É mais robusto que background-attachment:fixed — funciona bem via file://
     e com data URI. z-index:-1 mantém a imagem atrás do conteúdo. */
  body::before{content:"";position:fixed;inset:0;z-index:-1;
       background-image:var(--bg-image);background-size:cover;background-position:center;background-repeat:no-repeat}
  .wrap{max-width:1040px;margin:0 auto;position:relative;z-index:0}
  /* vidro fosco: deixa a imagem de fundo aparecer atrás dos cartões sem perder leitura */
  .painel,.kpi,.item,.grafico,.alerta-box{backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
  /* ===== Banner Garapuvu ===== */
  header{margin:0 -20px 4px;padding:26px 28px;color:#fff;
         background:linear-gradient(135deg,var(--verde-escuro),var(--verde) 70%,var(--lima));
         display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;
         border-bottom:4px solid var(--amarelo)}
  .marca{display:flex;align-items:center;gap:10px}
  .leaf{color:var(--amarelo-claro);font-size:26px;line-height:1}
  h1{font-size:22px;margin:0;color:#fff}
  h1 small{display:block;font-weight:400;font-size:13px;color:#dbead0;margin-top:4px}
  h2{font-size:16px;margin:34px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--lima-claro);color:var(--titulo)}
  .acoes{display:flex;align-items:center;gap:10px;margin-left:auto}
  /* botão de tema: fica sobre o banner verde, então usa branco translúcido */
  .btn-tema{font:inherit;font-size:13px;font-weight:600;color:#fff;cursor:pointer;
            display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:8px;
            background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.38)}
  .btn-tema:hover{background:rgba(255,255,255,.24)}
  .btn-tema:focus-visible{outline:2px solid var(--amarelo-claro);outline-offset:2px}
  .btn-tema .icone{font-size:15px;line-height:1}
  @media print{ .btn-tema{display:none} }
  .veredito{font-weight:700;font-size:14px;letter-spacing:.04em;padding:10px 18px;border-radius:8px}
  .veredito.ok{color:#fff;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4)}
  .veredito.falha{color:#fff;background:var(--coral);border:1px solid #fff3}
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:20px}
  .kpi{background:var(--card);border:1px solid var(--linha);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:2px;border-top:3px solid var(--lima)}
  .kpi-v{font-size:22px;font-weight:650}
  .kpi-r{font-size:12px;color:var(--suave);text-transform:uppercase;letter-spacing:.05em}
  .kpi.bom{border-top-color:var(--verde)} .kpi.bom .kpi-v{color:var(--ok)}
  .kpi.alerta{border-top-color:var(--amarelo)} .kpi.alerta .kpi-v{color:var(--alerta)}
  .kpi.ruim{border-top-color:var(--coral);border-color:var(--erro)} .kpi.ruim .kpi-v{color:var(--erro)}
  .alerta-box{margin-top:20px;padding:16px 20px;border-radius:10px;background:var(--erro-bg);border:1px solid var(--erro);border-left:5px solid var(--coral)}
  .alerta-box strong{display:block;color:var(--erro);font-size:15px;margin-bottom:6px}
  .alerta-box p{margin:10px 0 4px;font-size:13px;color:var(--suave)}
  .alerta-box ul{margin:0;padding-left:20px}
  .alerta-box li{margin:3px 0;font-size:14px}
  .painel{background:var(--card);border:1px solid var(--linha);border-radius:10px;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:14px;min-width:520px}
  th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--linha);vertical-align:middle}
  th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#fff;background:var(--verde);font-weight:600}
  th:first-child{border-top-left-radius:10px} th:last-child{border-top-right-radius:10px}
  tbody tr:last-child td{border-bottom:0}
  td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  td.tipo{color:var(--suave);font-size:12px}
  tr.ok td:first-child{color:var(--ok);font-weight:700}
  tr.falha td:first-child{color:var(--erro);font-weight:700}
  tr.falha td:last-child{color:var(--erro);font-weight:600}
  a{color:var(--verde)} a:hover{color:var(--verde-escuro)}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:rgba(46,125,50,.10);padding:1px 5px;border-radius:4px}
  .barra-cel{display:flex;align-items:center;gap:8px;white-space:nowrap}
  .barra{flex:1;min-width:80px;height:7px;border-radius:4px;background:rgba(124,179,66,.25);overflow:hidden}
  .barra i{display:block;height:100%;background:var(--verde)}
  tr.falha .barra i{background:var(--coral)}
  .grafico{background:var(--card);border:1px solid var(--linha);border-radius:10px;padding:18px 20px 14px;display:flex;gap:14px;height:250px}
  .col{flex:1;display:grid;grid-template-rows:auto 1fr auto;justify-items:center;gap:6px}
  .col-trilho{width:100%;align-self:stretch;display:flex;align-items:flex-end;justify-content:center}
  .col-barra{width:100%;max-width:96px;background:var(--lima);opacity:.55;border-radius:4px 4px 0 0}
  .col.destaque .col-barra{opacity:1;background:var(--amarelo)}
  .col-v{font-size:12.5px;font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
  .col-r{font-size:12px;color:var(--suave);white-space:nowrap}
  .col.destaque .col-r{color:var(--coral);font-weight:700}
  /* ===== Glossário de métricas ===== */
  .guia{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
  .item{background:var(--card);border:1px solid var(--linha);border-left:4px solid var(--lima);border-radius:10px;padding:14px 16px}
  .item.custom{border-left-color:var(--amarelo)}
  .item-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px}
  .item-top b{font-size:14.5px;color:var(--titulo)}
  .tag{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;background:rgba(124,179,66,.18);color:var(--verde);padding:2px 7px;border-radius:20px}
  .item.custom .tag{background:rgba(249,168,37,.2);color:var(--coral)}
  .item-val{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:650;font-size:13px;color:var(--txt)}
  .item p{margin:4px 0;font-size:13.5px}
  .item .analisar{background:var(--ok-bg);border-radius:8px;padding:7px 10px;color:var(--txt)}
  .item .ref{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:600}
  /* ----- Métricas que REPROVARAM o build: o material de estudo da falha ----- */
  .guia-aviso{background:var(--erro-bg);border:1px solid var(--erro);border-radius:10px;
              padding:12px 16px;margin-bottom:14px;font-size:13.5px}
  .item.reprovada{border-left-color:var(--erro);border-color:var(--erro);
                  box-shadow:0 0 0 1px var(--erro) inset}
  .item.reprovada .item-top b{color:var(--erro)}
  .item.reprovada .tag{background:rgba(192,57,43,.18);color:var(--erro)}
  .selo-falha{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
              background:var(--erro);color:#fff;padding:2px 8px;border-radius:20px}
  .motivo{margin-top:9px;background:var(--erro-bg);border:1px solid var(--erro);
          border-radius:8px;padding:9px 12px}
  .motivo-titulo{display:block;color:var(--erro);font-weight:700;font-size:12.5px;
                 text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
  .motivo ul{margin:0;padding-left:18px}
  .motivo li{font-size:13px;margin:2px 0}
  .motivo .escopo{color:var(--suave);font-size:11.5px}
  .motivo-estudo{margin:8px 0 0;font-size:13px;font-style:italic}
  .vazio{color:var(--suave);font-style:italic;padding:4px 0}
  /* coluna "Falhas": o "—" e o "0 de N" ficam discretos; só o número que
     importa (falhas > 0) recebe destaque */
  .na{color:var(--suave);cursor:help} .suave{color:var(--suave)}
  footer{margin-top:40px;color:var(--suave);font-size:12px;text-align:center}
  footer a{margin:0 6px}
</style>
<script>
  /* Aplica o tema salvo ANTES da tela pintar, para não piscar na cor errada.
     Roda aqui no <head> justamente por isso. */
  try {
    var salvo = localStorage.getItem("k6-relatorio-tema");
    if (salvo === "claro" || salvo === "escuro") document.documentElement.dataset.tema = salvo;
  } catch (e) { /* file:// sem localStorage — segue com o tema do sistema */ }
</script>
</head>
<body>
<div class="wrap">
  <header>
    <div class="marca">
      <span class="leaf">✿</span>
      <h1>Relatório de performance — ${esc(nome)}
        <small>FreelaAvalia 360 · Projeto Social Garapuvu · k6 · ${new Date().toLocaleString("pt-BR")} · duração ${duracao(duracaoMs)}</small>
      </h1>
    </div>
    <div class="acoes">
      <button type="button" class="btn-tema" id="btn-tema" title="Alternar tema: automático → claro → escuro">
        <span class="icone" aria-hidden="true">◐</span><span class="rotulo">Tema: auto</span>
      </button>
      <div class="veredito ${aprovado ? "ok" : "falha"}">QUALITY GATE: ${aprovado ? "APROVADO" : "REPROVADO"}</div>
    </div>
  </header>

  ${caixaFalhas(gates, checks)}

  <div class="kpis">${kpis}</div>

  <h2>Quality gate — thresholds</h2>
  <div class="painel">${tabelaThresholds(gates)}</div>

  <h2>Tempo de resposta (http_req_duration)</h2>
  ${graficoLatencia(dur) || `<p class="vazio">Sem requisições HTTP registradas.</p>`}

  <h2>Checks (asserts)</h2>
  <div class="painel">${tabelaChecks(checks)}</div>

  <h2>Métricas customizadas</h2>
  <div class="painel">${tabelaMetricas(metrics, (n) => !PADRAO.test(n))}</div>

  <h2>Métricas padrão do k6</h2>
  <div class="painel">${tabelaMetricas(metrics, (n) => PADRAO.test(n))}</div>

  <h2>Entendendo cada métrica (glossário)</h2>
  ${guiaMetricas(metrics, gates, checks)}

  <footer>
    Gerado por <code>lib/report.js</code> · <code>handleSummary()</code> do k6 · cores do Projeto Garapuvu<br>
    Referências:
    <a href="${REF.metrics}" target="_blank" rel="noreferrer">Métricas</a>·
    <a href="${REF.thresholds}" target="_blank" rel="noreferrer">Thresholds</a>·
    <a href="${REF.checks}" target="_blank" rel="noreferrer">Checks</a>·
    <a href="${REF.custom}" target="_blank" rel="noreferrer">Métricas customizadas</a>·
    <a href="${REF.fim}" target="_blank" rel="noreferrer">Resumo de fim de teste</a>
  </footer>
</div>
<script>
  /* Botão de tema. Três estados em ciclo:
       auto   → segue o sistema (prefers-color-scheme), sem atributo nenhum
       claro  → força claro    (data-tema="claro"  no <html>)
       escuro → força escuro   (data-tema="escuro" no <html>)
     Quem faz a cor mudar é o CSS de lib/tokens.js, que tem uma regra para cada
     caso — aqui só trocamos o atributo. A escolha fica salva no navegador. */
  (function () {
    var CHAVE = "k6-relatorio-tema";
    var CICLO = ["auto", "claro", "escuro"];
    var FACE = { auto: ["◐", "auto"], claro: ["☀", "claro"], escuro: ["☾", "escuro"] };
    var btn = document.getElementById("btn-tema");
    var icone = btn.querySelector(".icone");
    var rotulo = btn.querySelector(".rotulo");

    function aplicar(modo) {
      if (modo === "auto") delete document.documentElement.dataset.tema;
      else document.documentElement.dataset.tema = modo;
      icone.textContent = FACE[modo][0];
      rotulo.textContent = "Tema: " + FACE[modo][1];
      btn.setAttribute("aria-label", "Tema " + FACE[modo][1] + " — clique para alternar");
    }

    var modo = "auto";
    try { modo = localStorage.getItem(CHAVE) || "auto"; } catch (e) {}
    if (CICLO.indexOf(modo) < 0) modo = "auto";
    aplicar(modo);

    btn.addEventListener("click", function () {
      modo = CICLO[(CICLO.indexOf(modo) + 1) % CICLO.length];
      aplicar(modo);
      // Em file:// alguns navegadores bloqueiam o localStorage: a troca vale
      // para a sessão, só não é lembrada no próximo abrir.
      try { localStorage.setItem(CHAVE, modo); } catch (e) {}
    });
  })();
</script>
</body>
</html>`;

  return {
    [arquivoHtml]: html,
    [`reports/${nome}.json`]: JSON.stringify(data, null, 2),
    stdout: resumoTexto(data, nome, gates, arquivoHtml),
  };
}
