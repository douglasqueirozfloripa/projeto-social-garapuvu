/**
 * bugs-repo.js — Repositório de bugs em memória.
 *
 * Simula o banco de dados de uma API real. Como é uma aula,
 * os dados vivem só em memória: reiniciou o servidor, zerou a lista.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const { validarBug, normalizarBug } = require('../frontend/js/validators.js');

function criarRepositorio() {
  let bugs = [];
  let proximoId = 1;

  return {
    listar(filtros = {}) {
      let resultado = [...bugs];
      if (filtros.status && filtros.status !== 'todos') {
        resultado = resultado.filter((b) => b.status === filtros.status);
      }
      if (filtros.severidade && filtros.severidade !== 'todas') {
        resultado = resultado.filter((b) => b.severidade === filtros.severidade);
      }
      return resultado;
    },

    buscar(id) {
      return bugs.find((b) => b.id === Number(id)) || null;
    },

    criar(dados) {
      const validacao = validarBug(dados);
      if (!validacao.valido) {
        const erro = new Error('Bug inválido');
        erro.codigo = 'VALIDACAO';
        erro.detalhes = validacao.erros;
        throw erro;
      }
      const bug = {
        id: proximoId++,
        ...normalizarBug(dados),
        criadoEm: new Date().toISOString()
      };
      bugs.push(bug);
      return bug;
    },

    atualizar(id, dados) {
      const bug = this.buscar(id);
      if (!bug) return null;

      const atualizado = { ...bug, ...dados, id: bug.id, criadoEm: bug.criadoEm };
      const validacao = validarBug(atualizado);
      if (!validacao.valido) {
        const erro = new Error('Bug inválido');
        erro.codigo = 'VALIDACAO';
        erro.detalhes = validacao.erros;
        throw erro;
      }
      bugs = bugs.map((b) => (b.id === bug.id ? atualizado : b));
      return atualizado;
    },

    remover(id) {
      const bug = this.buscar(id);
      if (!bug) return false;
      bugs = bugs.filter((b) => b.id !== bug.id);
      return true;
    },

    resetar() {
      bugs = [];
      proximoId = 1;
    },

    total() {
      return bugs.length;
    }
  };
}

module.exports = { criarRepositorio };
