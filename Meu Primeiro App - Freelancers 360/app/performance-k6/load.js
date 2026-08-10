// load.js — TESTE DE CARGA com RAMPAGE (subida e descida graduais de usuários).
// Simula o "dia" da aplicação: começa vazia, sobe até um pico baixo (manhã),
// dispara para um PICO ALTO (horário de pico), e depois cai para um vale
// (madrugada). Assim medimos como a API se comporta em cada patamar.
//
// Rodar:  k6 run load.js
//         k6 run -e BASE_URL=https://staging.exemplo.dev load.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, cadastrar, login } from "./lib/helpers.js";
import { relatorio, TREND_STATS } from "./lib/report.js";

export const options = {
  // Garante que o resumo (e o relatório) tragam p(90), p(95) e p(99).
  summaryTrendStats: TREND_STATS,
  // Um "scenario" descreve COMO os usuários chegam. Aqui usamos o executor
  // 'ramping-vus', que sobe/desce o número de VUs seguindo as "stages".
  scenarios: {
    rampage: {
      executor: "ramping-vus",
      startVUs: 0,
      // Cada stage: "em X tempo, chegue a Y usuários" (interpolando linearmente).
      // É isto que cria a RAMPA (rampage) de pico alto e pico baixo.
      stages: [
        { duration: "30s", target: 20 },  // ↗ sobe até 20 VUs .......... pico BAIXO (manhã)
        { duration: "1m",  target: 20 },  // → mantém 20 ................. patamar estável
        { duration: "30s", target: 100 }, // ↗ sobe até 100 VUs .......... PICO ALTO (horário de pico)
        { duration: "1m",  target: 100 }, // → sustenta o pico alto ...... resistência sob carga
        { duration: "30s", target: 10 },  // ↘ desce para 10 ............. VALE (fim do dia)
        { duration: "20s", target: 0 },   // ↘ encerra ................... ramp-down
      ],
      gracefulRampDown: "10s", // dá 10s para as iterações em andamento terminarem
    },
  },

  // ---------- QUALITY GATE (portão de qualidade) ----------
  // Se QUALQUER threshold abaixo falhar, o k6 termina com status de reprovação.
  // Para MUDAR o gate, basta editar estes valores (mais rígido = número menor).
  thresholds: {
    http_req_failed: ["rate<0.02"],                  // < 2% de falhas
    http_req_duration: ["p(95)<800", "p(99)<1500"],  // p95 < 800ms E p99 < 1.5s
    checks: ["rate>0.99"],                           // > 99% dos checks passam
  },
};

export default function () {
  // Leitura pública (lista de projetos) — o endpoint mais chamado da app.
  const lista = http.get(`${BASE_URL}/contratos`);
  check(lista, { "lista projetos → 200": (r) => r.status === 200 });

  // Escrita (cadastro) + login: exercita o caminho que toca o repositório.
  const { email, senha } = cadastrar("load");
  login(email, senha);

  // Think time VARIÁVEL (1–3s): usuários reais não agem em intervalos iguais.
  sleep(Math.random() * 2 + 1);
}

// ---------- RELATÓRIO ----------
// O k6 chama handleSummary() ao final do teste. Devolvemos o HTML (+ JSON) que
// será gravado em performance-k6/reports/load.html
export function handleSummary(data) {
  return relatorio(data, "load");
}
