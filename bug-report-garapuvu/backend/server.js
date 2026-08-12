/**
 * server.js — Sobe a API + frontend na porta 3000.
 *
 * Uso: npm start  →  http://localhost:3000
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const { criarApp } = require('./app.js');

const PORTA = process.env.PORT || 3000;
const app = criarApp();

app.listen(PORTA, () => {
  console.log(`🐛 Bug Report Garapuvu rodando em http://localhost:${PORTA}`);
});
