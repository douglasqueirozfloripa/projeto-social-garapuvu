/**
 * storage.js — Camada de persistência local (localStorage).
 *
 * Guarda: rascunho do formulário, cópia offline dos bugs e preferências.
 * Todas as chaves usam o prefixo "grpv_" (Garapuvu) para não conflitar
 * com outros apps no mesmo domínio.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const CHAVES = {
  RASCUNHO: 'grpv_rascunho_bug',
  BUGS_OFFLINE: 'grpv_bugs_offline',
  PREFERENCIAS: 'grpv_preferencias'
};

/**
 * Cria a camada de storage. Recebe o "storage" por injeção de dependência,
 * o que facilita os testes unitários (dá para passar um mock).
 * @param {Storage} storage - normalmente window.localStorage
 */
function criarStorage(storage) {
  if (!storage) {
    throw new Error('É preciso fornecer um objeto storage (ex.: window.localStorage).');
  }

  function lerJSON(chave, padrao) {
    try {
      const bruto = storage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (_erro) {
      // JSON corrompido: devolve o padrão em vez de quebrar a aplicação
      return padrao;
    }
  }

  return {
    // ----- Rascunho do formulário -----
    salvarRascunho(rascunho) {
      storage.setItem(CHAVES.RASCUNHO, JSON.stringify(rascunho));
    },
    lerRascunho() {
      return lerJSON(CHAVES.RASCUNHO, null);
    },
    limparRascunho() {
      storage.removeItem(CHAVES.RASCUNHO);
    },

    // ----- Cópia offline dos bugs (fallback quando a API está fora) -----
    salvarBugsOffline(bugs) {
      storage.setItem(CHAVES.BUGS_OFFLINE, JSON.stringify(bugs));
    },
    lerBugsOffline() {
      return lerJSON(CHAVES.BUGS_OFFLINE, []);
    },
    adicionarBugOffline(bug) {
      const bugs = lerJSON(CHAVES.BUGS_OFFLINE, []);
      bugs.push(bug);
      storage.setItem(CHAVES.BUGS_OFFLINE, JSON.stringify(bugs));
      return bugs;
    },

    // ----- Preferências do usuário -----
    salvarPreferencias(prefs) {
      storage.setItem(CHAVES.PREFERENCIAS, JSON.stringify(prefs));
    },
    lerPreferencias() {
      return lerJSON(CHAVES.PREFERENCIAS, { filtroStatus: 'todos' });
    }
  };
}

const apiStorage = { criarStorage, CHAVES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiStorage;
}
if (typeof window !== 'undefined') {
  window.GarapuvuStorage = apiStorage;
}
