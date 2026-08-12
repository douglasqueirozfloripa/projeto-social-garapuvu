/**
 * Testes UNITÁRIOS — bugs-repo.js (repositório em memória do backend)
 */

const { criarRepositorio } = require('../../backend/bugs-repo.js');

function dadosValidos(extras = {}) {
  return {
    titulo: 'Contador de visitantes duplica',
    passos: '1. Abrir a landing. 2. Recarregar a página.',
    esperado: 'Contador soma 1 por navegador',
    obtido: 'Contador soma 2',
    severidade: 'media',
    prioridade: 'media',
    ...extras
  };
}

describe('criarRepositorio', () => {
  let repo;

  beforeEach(() => {
    repo = criarRepositorio();
  });

  test('começa vazio', () => {
    expect(repo.listar()).toEqual([]);
    expect(repo.total()).toBe(0);
  });

  test('cria bug com id sequencial, status padrão e data de criação', () => {
    const bug = repo.criar(dadosValidos());
    expect(bug.id).toBe(1);
    expect(bug.status).toBe('aberto');
    expect(bug.criadoEm).toEqual(expect.any(String));

    const segundo = repo.criar(dadosValidos({ titulo: 'Outro bug qualquer' }));
    expect(segundo.id).toBe(2);
  });

  test('recusa bug inválido com erro de validação detalhado', () => {
    expect(() => repo.criar({ titulo: 'x' })).toThrow('Bug inválido');
    try {
      repo.criar({ titulo: 'x' });
    } catch (erro) {
      expect(erro.codigo).toBe('VALIDACAO');
      expect(erro.detalhes.length).toBeGreaterThan(0);
    }
    expect(repo.total()).toBe(0);
  });

  test('buscar devolve o bug certo ou null', () => {
    const bug = repo.criar(dadosValidos());
    expect(repo.buscar(bug.id)).toEqual(bug);
    expect(repo.buscar('1')).toEqual(bug); // aceita id como string (vem da URL)
    expect(repo.buscar(999)).toBeNull();
  });

  test('listar filtra por status e severidade', () => {
    repo.criar(dadosValidos({ severidade: 'baixa' }));
    const b = repo.criar(dadosValidos({ titulo: 'Bug crítico de login', severidade: 'critica' }));
    repo.atualizar(b.id, { status: 'corrigido' });

    expect(repo.listar({ status: 'corrigido' })).toHaveLength(1);
    expect(repo.listar({ severidade: 'critica' })).toHaveLength(1);
    expect(repo.listar({ status: 'todos', severidade: 'todas' })).toHaveLength(2);
  });

  test('atualizar muda o status preservando id e criadoEm', () => {
    const bug = repo.criar(dadosValidos());
    const atualizado = repo.atualizar(bug.id, { status: 'em_analise' });
    expect(atualizado.status).toBe('em_analise');
    expect(atualizado.id).toBe(bug.id);
    expect(atualizado.criadoEm).toBe(bug.criadoEm);
  });

  test('atualizar bug inexistente devolve null', () => {
    expect(repo.atualizar(42, { status: 'fechado' })).toBeNull();
  });

  test('atualizar com dados inválidos é recusado', () => {
    const bug = repo.criar(dadosValidos());
    expect(() => repo.atualizar(bug.id, { severidade: 'galactica' })).toThrow('Bug inválido');
    // e o original permanece intacto
    expect(repo.buscar(bug.id).severidade).toBe('media');
  });

  test('remover apaga o bug e devolve false para inexistente', () => {
    const bug = repo.criar(dadosValidos());
    expect(repo.remover(bug.id)).toBe(true);
    expect(repo.total()).toBe(0);
    expect(repo.remover(bug.id)).toBe(false);
  });

  test('resetar limpa tudo e reinicia os ids', () => {
    repo.criar(dadosValidos());
    repo.resetar();
    expect(repo.total()).toBe(0);
    expect(repo.criar(dadosValidos()).id).toBe(1);
  });
});
