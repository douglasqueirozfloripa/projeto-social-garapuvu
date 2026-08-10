// custom-quality-gate.js — QUALITY GATE CUSTOMIZADO + ASSERTS CUSTOMIZADOS.
//
// O k6 já traz métricas prontas (http_req_duration, http_req_failed...). Mas
// muitas vezes o que importa é uma métrica DE NEGÓCIO: "quanto tempo leva o
// fluxo completo do contratante?", "qual a taxa de login bem-sucedido?",
// "quantos projetos conseguimos criar?". Aqui nós:
//   1) criamos MÉTRICAS CUSTOMIZADAS (Trend, Rate, Counter);
//   2) definimos THRESHOLDS sobre elas (o "quality gate" customizado);
//   3) escrevemos ASSERTS customizados com check() (inclusive no corpo JSON);
//   4) usamos abortOnFail para DERRUBAR o teste se a app degradar de vez.
//
// Rodar:  k6 run custom-quality-gate.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";
import { BASE_URL, JSON_HEADERS, emailUnico, criarProjeto } from "./lib/helpers.js";
import { relatorio, TREND_STATS } from "./lib/report.js";

// ---------- 1) MÉTRICAS CUSTOMIZADAS ----------
// Trend  = distribuição de valores (min/avg/p90/p95/max). O 'true' liga a
//          formatação de tempo (ms). Ideal para "duração do fluxo".
const fluxoNegocioDuracao = new Trend("fluxo_negocio_duracao", true);
// Rate   = proporção de verdadeiro/falso (ex.: % de sucesso).
const loginSucesso = new Rate("login_sucesso");
// Counter = soma acumulada (ex.: total de projetos criados no teste).
const projetosCriados = new Counter("projetos_criados");

export const options = {
  // Garante que o resumo (e o relatório) tragam p(90), p(95) e p(99).
  summaryTrendStats: TREND_STATS,
  vus: 10,
  duration: "1m",

  // ---------- 2) O QUALITY GATE (padrão + customizado) ----------
  thresholds: {
    // Gate PADRÃO do k6:
    http_req_failed: ["rate<0.02"], // < 2% de falhas de rede/HTTP

    // Gate CUSTOMIZADO, sobre as métricas que criamos acima:
    fluxo_negocio_duracao: ["p(95)<2000"], // 95% dos fluxos completos em < 2s
    login_sucesso: ["rate>0.98"],          // > 98% de logins bem-sucedidos
    projetos_criados: ["count>50"],        // ao menos 50 projetos no teste todo

    // Gate com ABORT: se a criação de projeto (requisição marcada com a tag
    // tipo:critico) passar de 1s no p95, o teste é ABORTADO na hora — evita
    // gastar tempo martelando um sistema que já degradou. O delayAbortEval
    // dá 10s de aquecimento antes de começar a avaliar.
    "http_req_duration{tipo:critico}": [
      { threshold: "p(95)<1000", abortOnFail: true, delayAbortEval: "10s" },
    ],
  },
};

export default function () {
  const inicio = Date.now();

  // Cadastra um CONTRATANTE (só contratante cria projeto — regra RN-04).
  const email = emailUnico("qg_contratante");
  const cad = http.post(
    `${BASE_URL}/usuarios`,
    JSON.stringify({ nome: "QG", email, papel: "contratante", senha: "1234" }),
    JSON_HEADERS
  );
  check(cad, { "cadastro contratante → 201": (r) => r.status === 201 });

  // Login — o resultado alimenta a métrica customizada login_sucesso (Rate).
  const log = http.post(`${BASE_URL}/login`, JSON.stringify({ email, senha: "1234" }), JSON_HEADERS);
  const okLogin = check(log, { "login → 200": (r) => r.status === 200 });
  loginSucesso.add(okLogin); // add(true/false) → o k6 calcula a % de sucesso
  if (!okLogin) return;      // sem login não dá para seguir o fluxo

  const contratanteId = log.json("id");

  // Cria um projeto — requisição CRÍTICA (marcada com a tag tipo:critico,
  // usada pelo threshold com abortOnFail lá em cima).
  const proj = criarProjeto(contratanteId, "Projeto de carga", { tipo: "critico" });

  // ---------- 3) ASSERTS CUSTOMIZADOS ----------
  // Além do status, validamos o CONTEÚDO da resposta (asserts de negócio).
  const okProj = check(proj, {
    "projeto criado → 201": (r) => r.status === 201,
    "projeto veio com id": (r) => r.json("id") !== undefined,
    "status inicial = aberto": (r) => r.json("status") === "aberto",
    "destaque começa desligado": (r) => r.json("destaque") === false,
  });
  if (okProj) projetosCriados.add(1); // incrementa o Counter customizado

  // Registra a duração do FLUXO COMPLETO na métrica customizada (Trend).
  fluxoNegocioDuracao.add(Date.now() - inicio);

  sleep(1);
}

// ---------- RELATÓRIO ----------
// O k6 chama handleSummary() ao final do teste. Devolvemos o HTML (+ JSON) que
// será gravado em performance-k6/reports/custom-quality-gate.html
export function handleSummary(data) {
  return relatorio(data, "custom-quality-gate");
}
