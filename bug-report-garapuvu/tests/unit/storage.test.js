/**
 * Testes UNITÁRIOS — storage.js (camada de localStorage)
 *
 * @jest-environment jsdom
 *
 * O jsdom fornece um window.localStorage de verdade em memória,
 * então testamos o comportamento real da camada de persistência.
 */

const { criarStorage, CHAVES } = require('../../frontend/js/storage.js');

describe('criarStorage', () => {
  let storage;

  beforeEach(() => {
    window.localStorage.clear();
    storage = criarStorage(window.localStorage);
  });

  test('exige um objeto storage (injeção de dependência)', () => {
    expect(() => criarStorage()).toThrow(/storage/i);
  });

  describe('rascunho do formulário', () => {
    test('salva e recupera o rascunho', () => {
      storage.salvarRascunho({ titulo: 'Bug em andamento' });
      expect(storage.lerRascunho()).toEqual({ titulo: 'Bug em andamento' });
    });

    test('retorna null quando não há rascunho', () => {
      expect(storage.lerRascunho()).toBeNull();
    });

    test('limparRascunho remove o rascunho', () => {
      storage.salvarRascunho({ titulo: 'algo' });
      storage.limparRascunho();
      expect(storage.lerRascunho()).toBeNull();
    });

    test('usa a chave com prefixo grpv_', () => {
      storage.salvarRascunho({ a: 1 });
      expect(window.localStorage.getItem(CHAVES.RASCUNHO)).not.toBeNull();
      expect(CHAVES.RASCUNHO.startsWith('grpv_')).toBe(true);
    });
  });

  describe('bugs offline', () => {
    test('começa com lista vazia', () => {
      expect(storage.lerBugsOffline()).toEqual([]);
    });

    test('salva e lê uma lista de bugs', () => {
      const bugs = [{ id: 1, titulo: 'Bug A' }];
      storage.salvarBugsOffline(bugs);
      expect(storage.lerBugsOffline()).toEqual(bugs);
    });

    test('adicionarBugOffline acumula bugs', () => {
      storage.adicionarBugOffline({ id: -1, titulo: 'Offline 1' });
      storage.adicionarBugOffline({ id: -2, titulo: 'Offline 2' });
      expect(storage.lerBugsOffline()).toHaveLength(2);
    });
  });

  describe('preferências', () => {
    test('devolve padrão quando nada foi salvo', () => {
      expect(storage.lerPreferencias()).toEqual({ filtroStatus: 'todos' });
    });

    test('salva e recupera preferências de filtro', () => {
      storage.salvarPreferencias({ filtroStatus: 'aberto', filtroSeveridade: 'critica' });
      expect(storage.lerPreferencias()).toEqual({
        filtroStatus: 'aberto',
        filtroSeveridade: 'critica'
      });
    });
  });

  describe('robustez', () => {
    test('JSON corrompido no localStorage não quebra a aplicação', () => {
      window.localStorage.setItem(CHAVES.BUGS_OFFLINE, '{isso não é json válido');
      expect(storage.lerBugsOffline()).toEqual([]);
    });
  });
});
