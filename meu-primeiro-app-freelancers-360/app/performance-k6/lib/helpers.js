// lib/helpers.js — Funções compartilhadas pelos testes de performance (k6).
// Concentrar aqui o "como falar com a API" evita repetição e deixa cada script
// focado no CENÁRIO de carga, não nos detalhes de cada requisição.

import http from "k6/http";
import { check } from "k6";

// BASE_URL da API. Por padrão aponta para a API local do FreelaAvalia 360.
// Troque sem editar código, passando a variável de ambiente:
//   k6 run -e BASE_URL=https://staging.seu-dominio.dev load.js
export const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

// Cabeçalho padrão de JSON (a API só entende application/json).
export const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

// Gera um e-mail ÚNICO por iteração. Necessário porque o cadastro tem a regra
// de negócio "e-mail único" (RN-01): repetir e-mail retornaria 400 e poluiria
// a taxa de erro do teste com falhas que não são de performance.
export function emailUnico(prefixo = "perf") {
  return `${prefixo}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@teste.dev`;
}

// Cadastra um usuário e valida o 201.
// `prefixo` só identifica o e-mail (útil para saber de qual teste veio o dado);
// `papel` é o que a API valida — precisa ser "freelancer" ou "contratante"
// (RN: papel inválido → 400), por isso os dois parâmetros são separados.
// Retorna { user, email, senha } para reaproveitar no login/fluxo.
export function cadastrar(prefixo = "perf", papel = "freelancer") {
  const email = emailUnico(prefixo);
  const corpo = JSON.stringify({ nome: "Perf User", email, papel, senha: "1234" });
  const res = http.post(`${BASE_URL}/usuarios`, corpo, JSON_HEADERS);
  check(res, { "cadastro → 201": (r) => r.status === 201 });
  return { user: res.status === 201 ? res.json() : null, email, senha: "1234" };
}

// Faz login e valida o 200. Retorna a resposta (para ler o id do usuário).
export function login(email, senha) {
  const res = http.post(`${BASE_URL}/login`, JSON.stringify({ email, senha }), JSON_HEADERS);
  check(res, { "login → 200": (r) => r.status === 200 });
  return res;
}

// Cria um projeto (precisa de um contratante). Aceita tags para permitir
// aplicar thresholds só a esta requisição (ex.: { tipo: "critico" }).
export function criarProjeto(contratanteId, titulo = "Projeto de carga", tags = {}) {
  const params = { headers: JSON_HEADERS.headers, tags };
  return http.post(`${BASE_URL}/contratos`, JSON.stringify({ titulo, contratanteId }), params);
}
