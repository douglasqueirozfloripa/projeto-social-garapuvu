// smoke.js — TESTE DE FUMAÇA (smoke test).
// Poucos usuários, curta duração. NÃO é para medir limite de carga — é o
// "liga e vê se acende": garantir que a API está de pé e que o caminho
// principal funciona ANTES de investir tempo rodando cargas pesadas.
//
// Rodar:  k6 run smoke.js
//         k6 run -e BASE_URL=https://staging.exemplo.dev smoke.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, cadastrar, login } from "./lib/helpers.js";
import { relatorio, TREND_STATS } from "./lib/report.js";

// ---------- SETUP DA EXECUÇÃO (options) ----------
// vus       = usuários virtuais simultâneos.
// duration  = por quanto tempo o teste roda.
// thresholds = QUALITY GATE: critérios que, se falharem, reprovam o teste
//              (o k6 sai com código != 0 — ótimo para travar o CI).
export const options = {
  // Garante que o resumo (e o relatório) tragam p(90), p(95) e p(99).
  summaryTrendStats: TREND_STATS,
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],    // menos de 1% de requisições com erro
    http_req_duration: ["p(95)<500"],  // 95% das respostas abaixo de 500 ms
    checks: ["rate>0.99"],             // mais de 99% dos checks passando
  },
};

// ---------- CÓDIGO QUE CADA VU EXECUTA EM LOOP ----------
export default function () {
  // 1) A API está viva? /health é a sonda mais barata (não toca no banco).
  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health → 200": (r) => r.status === 200 });

  // 2) Caminho principal mínimo: cadastrar um usuário e logar.
  const { email, senha } = cadastrar("smoke");
  login(email, senha);

  // 3) "Think time": pausa de 1s imitando o tempo que um usuário real leva
  //    entre as ações. Sem sleep, 1 VU dispara requisições sem parar e o
  //    número vira irreal.
  sleep(1);
}

// ---------- RELATÓRIO ----------
// O k6 chama handleSummary() ao final do teste. Devolvemos o HTML (+ JSON) que
// será gravado em performance-k6/reports/smoke.html
export function handleSummary(data) {
  return relatorio(data, "smoke");
}
