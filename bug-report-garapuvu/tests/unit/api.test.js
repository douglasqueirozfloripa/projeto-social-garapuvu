/**
 * Testes UNITÁRIOS — api.js (cliente HTTP com fallback offline)
 *
 * @jest-environment jsdom
 *
 * O `fetch` é dublado para simular os três cenários que importam:
 *   1. API respondendo bem;
 *   2. API respondendo com erro de negócio (status HTTP) → o erro sobe;
 *   3. API fora do ar (erro de rede, sem status) → cai no localStorage.
 *
 * É essa terceira coluna que faz a plataforma funcionar mesmo abrindo o
 * index.html direto, sem `npm start`.
 */

const { criarClienteApi } = require('../../frontend/js/api.js');
const { criarStorage } = require('../../frontend/js/storage.js');

const BUG = {
  titulo: 'Botão não responde',
  passos: '1. Clicar no botão',
  esperado: 'Abre o painel',
  obtido: 'Nada acontece',
  severidade: 'alta',
  prioridade: 'media'
};

/** Resposta de sucesso do fetch. */
function respondeOk(corpo, status = 200) {
  return Promise.resolve({ ok: true, status, json: async () => corpo });
}

/** Resposta de erro COM status: é erro da API, não de rede. */
function respondeErro(corpo, status = 400) {
  return Promise.resolve({ ok: false, status, json: async () => corpo });
}

/** API fora do ar: o fetch rejeita sem status nenhum. */
function apiForaDoAr() {
  return Promise.reject(new TypeError('Failed to fetch'));
}

describe('criarClienteApi', () => {
  let storage;
  let api;

  beforeEach(() => {
    window.localStorage.clear();
    storage = criarStorage(window.localStorage);
    api = criarClienteApi({ storage });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('configuração', () => {
    test('começa em modo online', () => {
      expect(api.offline).toBe(false);
    });

    test('usa o window.localStorage quando nenhum storage é injetado', async () => {
      // storage.js publica window.GarapuvuStorage ao ser carregado
      expect(window.GarapuvuStorage).toBeDefined();

      const semStorage = criarClienteApi();
      global.fetch.mockImplementation(apiForaDoAr);

      await expect(semStorage.listarBugs()).resolves.toEqual([]);
      expect(semStorage.offline).toBe(true);
    });

    test('respeita o baseUrl informado', async () => {
      const comBase = criarClienteApi({ baseUrl: 'http://localhost:9999', storage });
      global.fetch.mockImplementation(() => respondeOk([]));

      await comBase.listarBugs();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:9999/api/bugs', expect.any(Object));
    });

    test('envia o Content-Type de JSON', async () => {
      global.fetch.mockImplementation(() => respondeOk([]));

      await api.listarBugs();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bugs',
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
      );
    });
  });

  describe('listarBugs', () => {
    test('devolve os bugs da API', async () => {
      global.fetch.mockImplementation(() => respondeOk([{ id: 1, ...BUG }]));

      await expect(api.listarBugs()).resolves.toEqual([{ id: 1, ...BUG }]);
      expect(api.offline).toBe(false);
    });

    test('espelha a resposta no localStorage (cópia offline em dia)', async () => {
      global.fetch.mockImplementation(() => respondeOk([{ id: 1, ...BUG }]));

      await api.listarBugs();

      expect(storage.lerBugsOffline()).toEqual([{ id: 1, ...BUG }]);
    });

    test('cai para o localStorage quando a API está fora do ar', async () => {
      storage.salvarBugsOffline([{ id: -1, ...BUG }]);
      global.fetch.mockImplementation(apiForaDoAr);

      await expect(api.listarBugs()).resolves.toEqual([{ id: -1, ...BUG }]);
      expect(api.offline).toBe(true);
    });

    test('propaga erro da API (com status) em vez de mascarar como offline', async () => {
      global.fetch.mockImplementation(() => respondeErro({ erro: 'Boom' }, 500));

      await expect(api.listarBugs()).rejects.toThrow('Boom');
      expect(api.offline).toBe(false);
    });

    test('volta para o modo online quando a API responde de novo', async () => {
      global.fetch.mockImplementationOnce(apiForaDoAr);
      await api.listarBugs();
      expect(api.offline).toBe(true);

      global.fetch.mockImplementationOnce(() => respondeOk([]));
      await api.listarBugs();
      expect(api.offline).toBe(false);
    });
  });

  describe('criarBug', () => {
    test('faz POST e devolve o bug criado', async () => {
      global.fetch.mockImplementation(() => respondeOk({ id: 1, ...BUG }, 201));

      await expect(api.criarBug(BUG)).resolves.toEqual({ id: 1, ...BUG });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bugs',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(BUG) })
      );
    });

    test('propaga o erro de validação da API com os detalhes', async () => {
      global.fetch.mockImplementation(() =>
        respondeErro({ erro: 'Bug inválido', detalhes: ['O título precisa ter pelo menos 5 caracteres.'] }, 400)
      );

      await expect(api.criarBug({ titulo: 'Bug' })).rejects.toMatchObject({
        message: 'Bug inválido',
        status: 400,
        detalhes: ['O título precisa ter pelo menos 5 caracteres.']
      });
    });

    test('sem rede, salva no localStorage com id negativo', async () => {
      global.fetch.mockImplementation(apiForaDoAr);

      const criado = await api.criarBug(BUG);

      expect(criado.id).toBe(-1); // negativo para não colidir com os ids da API
      expect(criado.status).toBe('aberto');
      expect(criado.criadoEm).toBeDefined();
      expect(storage.lerBugsOffline()).toHaveLength(1);
      expect(api.offline).toBe(true);
    });

    test('sem rede, os ids offline não se repetem', async () => {
      global.fetch.mockImplementation(apiForaDoAr);

      const primeiro = await api.criarBug(BUG);
      const segundo = await api.criarBug(BUG);

      expect(primeiro.id).toBe(-1);
      expect(segundo.id).toBe(-2);
      expect(storage.lerBugsOffline()).toHaveLength(2);
    });

    test('sem rede, respeita o status já informado no bug', async () => {
      global.fetch.mockImplementation(apiForaDoAr);

      const criado = await api.criarBug({ ...BUG, status: 'em_analise' });

      expect(criado.status).toBe('em_analise');
    });
  });

  describe('atualizarBug', () => {
    test('faz PUT no id certo e devolve o bug atualizado', async () => {
      global.fetch.mockImplementation(() => respondeOk({ id: 7, ...BUG, status: 'corrigido' }));

      const atualizado = await api.atualizarBug(7, { ...BUG, status: 'corrigido' });

      expect(atualizado.status).toBe('corrigido');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bugs/7',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    test('propaga erro quando o bug não existe', async () => {
      global.fetch.mockImplementation(() => respondeErro({ erro: 'Bug não encontrado' }, 404));

      await expect(api.atualizarBug(999, BUG)).rejects.toThrow('Bug não encontrado');
    });
  });

  describe('removerBug', () => {
    test('faz DELETE e devolve true', async () => {
      // O backend responde 204 (sem corpo): o cliente não pode tentar dar .json()
      global.fetch.mockImplementation(() => Promise.resolve({ ok: true, status: 204 }));

      await expect(api.removerBug(3)).resolves.toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bugs/3',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('propaga erro quando o bug não existe', async () => {
      global.fetch.mockImplementation(() => respondeErro({ erro: 'Bug não encontrado' }, 404));

      await expect(api.removerBug(999)).rejects.toThrow('Bug não encontrado');
    });
  });

  describe('tratamento de erro da camada HTTP', () => {
    test('usa mensagem padrão quando a API não manda o campo erro', async () => {
      global.fetch.mockImplementation(() => respondeErro({}, 500));

      await expect(api.listarBugs()).rejects.toThrow('Erro na API');
    });

    test('detalhes vira lista vazia quando a API não manda detalhes', async () => {
      global.fetch.mockImplementation(() => respondeErro({ erro: 'Falhou' }, 422));

      await expect(api.criarBug(BUG)).rejects.toMatchObject({ detalhes: [] });
    });
  });
});
