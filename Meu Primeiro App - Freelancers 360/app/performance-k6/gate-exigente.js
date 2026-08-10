// gate-exigente.js — SIMULAÇÃO DE FALHA no quality gate.
//
// Todos os outros scripts deste projeto são calibrados para PASSAR. Este aqui
// existe para mostrar o outro lado: como o relatório e o CI se comportam quando
// a aplicação NÃO cumpre o acordado. Não é um teste "quebrado" — é o mesmo
// fluxo de negócio do custom-quality-gate.js, submetido a um SLA agressivo,
// como se um cliente premium tivesse contratado tempos de resposta de gente
// grande sem a infra de gente grande.
//
// A reprovação é DELIBERADA e vem por três caminhos diferentes, de propósito,
// para o relatório mostrar os três tipos de falha lado a lado:
//
//   1) THRESHOLD DE TEMPO      — p(95) e p(99) exigem uma latência que a API
//                                não entrega sob 50 VUs;
//   2) ASSERT DE NEGÓCIO       — um check cobra um campo ("prazo") que o
//                                POST /contratos não devolve. É um requisito
//                                real não implementado, não um erro de teste;
//   3) THRESHOLD COM abortOnFail — o gate da rota crítica ABORTA a execução no
//                                meio, provando que o k6 não fica martelando
//                                um sistema que já degradou.
//
// Rodar:  k6 run gate-exigente.js
// Espere: exit code != 0 e reports/gate-exigente.html em VERMELHO.

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";
import { BASE_URL, JSON_HEADERS, emailUnico, criarProjeto } from "./lib/helpers.js";
import { relatorio, TREND_STATS } from "./lib/report.js";

// Mesmas métricas customizadas do custom-quality-gate.js — o que muda aqui não
// é o QUE medimos, e sim o quanto exigimos.
const fluxoNegocioDuracao = new Trend("fluxo_negocio_duracao", true);
const loginSucesso = new Rate("login_sucesso");
const projetosCriados = new Counter("projetos_criados");

export const options = {
  // Garante que o resumo (e o relatório) tragam p(90), p(95) e p(99).
  summaryTrendStats: TREND_STATS,
  // 50 VUs: 5x a carga do custom-quality-gate.js. A pressão extra é o que faz
  // a latência subir o suficiente para bater nos limites apertados abaixo.
  vus: 50,
  duration: "45s",

  // ---------- QUALITY GATE EXIGENTE (o SLA "de gente grande") ----------
  thresholds: {
    // (1) Tempo de resposta: números de um serviço com cache e réplica de
    //     leitura. Nossa API é um Express de aula com repositório em memória —
    //     rápida, mas não a 2 ms de p(95) com 50 VUs concorrentes.
    http_req_duration: ["p(95)<2", "p(99)<3"],

    // Tolerância a erro quase zero: 0,1% (1 falha a cada 1000 requisições).
    http_req_failed: ["rate<0.001"],

    // (2) Exige 100% dos asserts passando — e um dos checks abaixo cobra um
    //     campo que a API não devolve, então esta linha reprova sozinha.
    checks: ["rate==1.00"],

    // Gate customizado, também apertado: o fluxo completo (cadastro + login +
    // criação de projeto) teria de fechar em 20 ms no p(95).
    fluxo_negocio_duracao: ["p(95)<20"],
    login_sucesso: ["rate==1.00"],
    projetos_criados: ["count>5000"], // meta de volume inalcançável em 45s

    // (3) O gate com ABORT. Se o p(95) da criação de projeto (tag tipo:critico)
    //     passar de 2 ms, o k6 ENCERRA o teste — por isso a duração real do
    //     relatório costuma ser bem menor que os 45s configurados.
    //     delayAbortEval dá 10s de aquecimento antes de começar a avaliar
    //     (sem isso, as primeiras iterações "frias" abortariam injustamente).
    "http_req_duration{tipo:critico}": [
      { threshold: "p(95)<2", abortOnFail: true, delayAbortEval: "10s" },
    ],
  },
};

export default function () {
  const inicio = Date.now();

  const email = emailUnico("gate_exigente");
  const cad = http.post(
    `${BASE_URL}/usuarios`,
    JSON.stringify({ nome: "SLA Premium", email, papel: "contratante", senha: "1234" }),
    JSON_HEADERS
  );
  check(cad, { "cadastro contratante → 201": (r) => r.status === 201 });

  const log = http.post(`${BASE_URL}/login`, JSON.stringify({ email, senha: "1234" }), JSON_HEADERS);
  const okLogin = check(log, { "login → 200": (r) => r.status === 200 });
  loginSucesso.add(okLogin);
  if (!okLogin) return;

  const proj = criarProjeto(log.json("id"), "Projeto SLA premium", { tipo: "critico" });

  const okProj = check(proj, {
    "projeto criado → 201": (r) => r.status === 201,
    "projeto veio com id": (r) => r.json("id") !== undefined,

    // ↓ ASSERT QUE FALHA DE PROPÓSITO (motivo 2 do cabeçalho).
    // O contrato com o cliente premium prevê prazo de entrega em todo projeto,
    // mas POST /contratos não devolve o campo "prazo" — a funcionalidade não
    // existe na API. É exatamente assim que um requisito não implementado
    // aparece num teste: não como erro de rede, e sim como assert vermelho.
    "projeto traz prazo de entrega (RN não implementada)": (r) => r.json("prazo") !== undefined,
  });
  if (okProj) projetosCriados.add(1);

  fluxoNegocioDuracao.add(Date.now() - inicio);

  // Think time curto: mantém a pressão alta sobre a API.
  sleep(0.5);
}

// ---------- RELATÓRIO ----------
// Repare que handleSummary roda IGUAL quando o gate reprova — inclusive quando
// o teste é abortado pelo abortOnFail. É por isso que dá para publicar o HTML
// no CI com `if: always()` e investigar a falha depois.
export function handleSummary(data) {
  return relatorio(data, "gate-exigente");
}
