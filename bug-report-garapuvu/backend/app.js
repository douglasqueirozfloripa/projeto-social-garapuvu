/**
 * app.js — API REST de bugs (Express).
 *
 * Separamos o "app" do "server" de propósito: assim os testes de API
 * (Supertest) conseguem importar o app sem abrir uma porta de verdade.
 *
 * Rotas:
 *   GET    /api/saude          → healthcheck
 *   GET    /api/bugs           → lista (filtros ?status= & ?severidade=)
 *   GET    /api/bugs/:id       → busca um bug
 *   POST   /api/bugs           → cria (400 se inválido)
 *   PUT    /api/bugs/:id       → atualiza (404 se não existe, 400 se inválido)
 *   DELETE /api/bugs/:id       → remove (404 se não existe)
 *   POST   /api/bugs/resetar   → limpa tudo (usado pelos testes E2E)
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const express = require('express');
const path = require('path');
const { criarRepositorio } = require('./bugs-repo.js');

function criarApp() {
  const app = express();
  const repo = criarRepositorio();

  app.use(express.json({ limit: '10mb' })); // evidências em dataURL podem ser grandes

  // Servir o frontend estático
  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  app.get('/api/saude', (_req, res) => {
    res.json({ ok: true, servico: 'bug-report-garapuvu', total: repo.total() });
  });

  app.get('/api/bugs', (req, res) => {
    const { status, severidade } = req.query;
    res.json(repo.listar({ status, severidade }));
  });

  app.get('/api/bugs/:id', (req, res) => {
    const bug = repo.buscar(req.params.id);
    if (!bug) return res.status(404).json({ erro: 'Bug não encontrado.' });
    res.json(bug);
  });

  app.post('/api/bugs', (req, res) => {
    try {
      const bug = repo.criar(req.body);
      res.status(201).json(bug);
    } catch (erro) {
      if (erro.codigo === 'VALIDACAO') {
        return res.status(400).json({ erro: 'Bug inválido.', detalhes: erro.detalhes });
      }
      throw erro;
    }
  });

  app.put('/api/bugs/:id', (req, res) => {
    try {
      const bug = repo.atualizar(req.params.id, req.body);
      if (!bug) return res.status(404).json({ erro: 'Bug não encontrado.' });
      res.json(bug);
    } catch (erro) {
      if (erro.codigo === 'VALIDACAO') {
        return res.status(400).json({ erro: 'Bug inválido.', detalhes: erro.detalhes });
      }
      throw erro;
    }
  });

  app.delete('/api/bugs/:id', (req, res) => {
    const removido = repo.remover(req.params.id);
    if (!removido) return res.status(404).json({ erro: 'Bug não encontrado.' });
    res.status(204).end();
  });

  // Endpoint auxiliar para os testes E2E começarem sempre do zero
  app.post('/api/bugs/resetar', (_req, res) => {
    repo.resetar();
    res.json({ ok: true });
  });

  return app;
}

module.exports = { criarApp };
