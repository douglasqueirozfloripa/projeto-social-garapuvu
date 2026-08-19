/**
 * ============================================================================
 *  SUÍTE "ILUSÃO" — os testes que dão 100% de cobertura em src/
 * ============================================================================
 *  Rode:  npm run cobertura
 *  Resultado: Statements 100% | Branches 100% | Functions 100% | Lines 100%
 *
 *  Todos passam. Todos os 9 arquivos de src/ têm bugs reais.
 *  Este é o ponto inteiro da aula: o número 100% não fala sobre qualidade,
 *  fala sobre quais linhas o interpretador visitou.
 * ============================================================================
 */

const caso01 = require('../../src/01-tipos-inesperados');
const caso02 = require('../../src/02-condicoes-compostas');
const caso03 = require('../../src/03-valor-limite');
const caso04 = require('../../src/04-assercao-fraca');
const caso05 = require('../../src/05-efeito-colateral');
const caso06 = require('../../src/06-async');
const caso07 = require('../../src/07-loop-e-lista-vazia');
const caso08 = require('../../src/08-numeros-e-igualdade');
const caso09 = require('../../src/09-requisito-ausente');

describe('01 — tipos inesperados', () => {
  it('aplica desconto de 10%', () => {
    expect(caso01.calcularInscricao(200, 10)).toBe(180);
  });
  it('sem desconto devolve o valor cheio', () => {
    expect(caso01.calcularInscricao(200, 0)).toBe(200);
  });
  it('soma duas doações', () => {
    expect(caso01.somarDoacoes(30, 20)).toBe(50);
  });
});

describe('02 — condições compostas', () => {
  it('maior de 16 com autorização pode se inscrever', () => {
    expect(caso02.podeInscrever(20, true, false)).toBe(true);
  });
  it('menor sem autorização e sem cadastro não pode', () => {
    expect(caso02.podeInscrever(10, false, false)).toBe(false);
  });
});

describe('03 — valor limite', () => {
  it('300 minutos fora do ar é crítica', () => {
    expect(caso03.classificarSeveridade(300)).toBe('critica');
  });
  it('120 minutos é alta', () => {
    expect(caso03.classificarSeveridade(120)).toBe('alta');
  });
  it('10 minutos é média', () => {
    expect(caso03.classificarSeveridade(10)).toBe('media');
  });
  it('sem indisponibilidade é baixa', () => {
    expect(caso03.classificarSeveridade(0)).toBe('baixa');
  });
});

describe('04 — asserção fraca', () => {
  it('gera um protocolo', () => {
    const protocolo = caso04.gerarProtocolo('Ana Paula Souza', new Date(2026, 2, 15));
    // Asserções que não verificam nada de útil:
    expect(protocolo).toBeDefined();
    expect(typeof protocolo).toBe('string');
    expect(protocolo.length).toBeGreaterThan(5);
  });
});

describe('05 — efeito colateral', () => {
  it('ordena as horas em ordem decrescente', () => {
    expect(caso05.ordenarHoras([3, 1, 8])).toEqual([8, 3, 1]);
  });
  it('totaliza as horas da lista', () => {
    expect(caso05.totalizarHoras([2, 3])).toBe(5);
  });
});

describe('06 — assíncrono', () => {
  it('devolve os dados do voluntário', async () => {
    const api = { get: async () => ({ status: 200, dados: { nome: 'Ana' } }) };
    await expect(caso06.buscarVoluntario(1, api)).resolves.toEqual({ nome: 'Ana' });
  });
  it('lida com voluntário inexistente', () => {
    const api = { get: async () => ({ status: 404 }) };
    // O `return`/`await` está faltando de propósito: o teste termina antes.
    caso06.buscarVoluntario(99, api).then((r) => {
      expect(r).toBeUndefined();
    });
  });
});

describe('07 — loop e lista vazia', () => {
  it('calcula a média de horas', () => {
    // ⚠️ Armadilha do "teste escrito depois": o valor esperado foi copiado da
    // SAÍDA DO CÓDIGO, não do requisito. A média real de [6, 12] é 9, não 3.
    // O teste passa, a linha fica coberta, e o defeito fica documentado como
    // se fosse comportamento correto.
    expect(caso07.mediaDeHoras([6, 12])).toBe(3);
  });
});

describe('08 — números e igualdade', () => {
  it('fecha o caixa somando as doações', () => {
    expect(caso08.fecharCaixa([10, 20])).toBe(30);
  });
  it('reconhece que há cupom', () => {
    expect(caso08.temCupom('BOLSA50')).toBe(true);
  });
  it('compara dois valores iguais', () => {
    expect(caso08.ehMesmoValor(5, 5)).toBe(true);
  });
});

describe('09 — requisito ausente', () => {
  it('inscreve o aluno na turma', () => {
    const turma = { nome: 'QA 2026', vagas: 2, inscritos: [] };
    expect(caso09.inscreverAluno(turma, { nome: 'Ana' }).inscritos).toHaveLength(1);
  });
  it('recusa aluno sem nome', () => {
    const turma = { nome: 'QA 2026', vagas: 2, inscritos: [] };
    expect(() => caso09.inscreverAluno(turma, {})).toThrow('nome é obrigatório');
  });
});
