// spike.js — TESTE DE PICO (spike test).
// Diferente do rampage suave do load.js, aqui o salto é BRUSCO: o tráfego
// dispara de repente (uma campanha, uma notícia viral, um post que bombou)
// e depois volta ao normal. O que queremos observar:
//   1) a API AGUENTA o susto sem derrubar?
//   2) ela se RECUPERA rápido quando o pico passa?
//
// Rodar:  k6 run spike.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, cadastrar } from "./lib/helpers.js";
import { relatorio, TREND_STATS } from "./lib/report.js";

export const options = {
  // Garante que o resumo (e o relatório) tragam p(90), p(95) e p(99).
  summaryTrendStats: TREND_STATS,
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },  // → tráfego normal (linha de base)
        { duration: "10s", target: 300 }, // ⇈ PICO ABRUPTO: 10 → 300 VUs em 10s
        { duration: "30s", target: 300 }, // → sustenta o pico (estresse máximo)
        { duration: "10s", target: 10 },  // ⇊ volta ao normal (janela de recuperação)
        { duration: "10s", target: 0 },   // encerra
      ],
    },
  },

  // No spike aceitamos um gate mais TOLERANTE: sob pico extremo, alguma
  // degradação é esperada. O importante é não estourar demais nem quebrar.
  thresholds: {
    http_req_failed: ["rate<0.05"],    // tolera até 5% de erros no auge
    http_req_duration: ["p(95)<2000"], // p95 abaixo de 2s mesmo no pico
  },
};

export default function () {
  const lista = http.get(`${BASE_URL}/contratos`);
  check(lista, { "lista projetos → 200": (r) => r.status === 200 });
  cadastrar("spike");
  sleep(1);
}

// ---------- RELATÓRIO ----------
// O k6 chama handleSummary() ao final do teste. Devolvemos o HTML (+ JSON) que
// será gravado em performance-k6/reports/spike.html
export function handleSummary(data) {
  return relatorio(data, "spike");
}
