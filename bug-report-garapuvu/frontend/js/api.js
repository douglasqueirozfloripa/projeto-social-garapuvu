/**
 * api.js — Cliente HTTP da API de bugs, com fallback offline.
 *
 * Se a API estiver fora do ar (ex.: abriu o index.html direto, sem `npm start`),
 * a plataforma continua funcionando usando o localStorage como armazenamento.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

/* global GarapuvuStorage */

function criarClienteApi({ baseUrl = '', storage } = {}) {
  const local = storage || GarapuvuStorage.criarStorage(window.localStorage);
  let modoOffline = false;

  async function chamar(caminho, opcoes = {}) {
    const resposta = await fetch(baseUrl + caminho, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes
    });
    if (resposta.status === 204) return null;
    const corpo = await resposta.json();
    if (!resposta.ok) {
      const erro = new Error(corpo.erro || 'Erro na API');
      erro.detalhes = corpo.detalhes || [];
      erro.status = resposta.status;
      throw erro;
    }
    return corpo;
  }

  return {
    get offline() {
      return modoOffline;
    },

    async listarBugs() {
      try {
        const bugs = await chamar('/api/bugs');
        modoOffline = false;
        local.salvarBugsOffline(bugs); // mantém a cópia local em dia
        return bugs;
      } catch (erro) {
        if (erro.status) throw erro; // erro "de verdade" da API, não de rede
        modoOffline = true;
        return local.lerBugsOffline();
      }
    },

    async criarBug(dados) {
      try {
        const bug = await chamar('/api/bugs', {
          method: 'POST',
          body: JSON.stringify(dados)
        });
        modoOffline = false;
        return bug;
      } catch (erro) {
        if (erro.status) throw erro;
        // Sem rede: salva offline com id negativo (para não colidir com a API)
        modoOffline = true;
        const bugs = local.lerBugsOffline();
        const bug = {
          id: -(bugs.length + 1),
          ...dados,
          status: dados.status || 'aberto',
          criadoEm: new Date().toISOString()
        };
        local.adicionarBugOffline(bug);
        return bug;
      }
    },

    async atualizarBug(id, dados) {
      const bug = await chamar(`/api/bugs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
      return bug;
    },

    async removerBug(id) {
      await chamar(`/api/bugs/${id}`, { method: 'DELETE' });
      return true;
    }
  };
}

const apiCliente = { criarClienteApi };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiCliente;
}
if (typeof window !== 'undefined') {
  window.GarapuvuApi = apiCliente;
}
