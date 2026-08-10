// api/index.js — Ponto de entrada da API na Vercel (Serverless Function).
//
// Localmente o backend sobe com `npm start` (backend/src/server.js) numa porta.
// Na Vercel não existe "porta": a plataforma importa este arquivo e entrega o
// (req, res) direto para o handler exportado — e uma app Express É um handler
// (req, res), então basta exportá-la como default.
//
// IMPORTANTE (limite do backend fake): o repositório é EM MEMÓRIA. Cada
// instância da função tem a sua própria memória e ela morre quando a instância
// hiberna (cold start). Ou seja: em produção os dados criados podem "sumir"
// depois de alguns minutos sem uso. Os usuários padrão são semeados a cada
// carregamento do módulo justamente para o login (senha 1234) nunca falhar.
// Para dados que persistem de verdade, é preciso um banco (ver README).
import express from "express";
import { criarApp } from "../backend/src/app.js";
import { semearUsuarios } from "../backend/src/repositorio.js";

semearUsuarios();

const backend = criarApp();
const servidor = express();

// A Vercel preserva a URL original na reescrita (a requisição chega como
// /api/login), por isso montamos a app do backend sob /api. O segundo use()
// cobre o caso de a função ser chamada já sem o prefixo — assim as rotas
// funcionam nos dois formatos, sem duplicar código.
servidor.use("/api", backend);
servidor.use(backend);

export default servidor;
