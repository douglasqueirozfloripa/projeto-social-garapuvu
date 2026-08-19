/**
 * ============================================================================
 *  SUÍTE "ROBUSTEZ" — a suíte que persegue 100% de cobertura DE VERDADE
 * ============================================================================
 *  Rode:  npm run cobertura:corrigido   (cobertura sobre src/corrigido/)
 *         npm run mutacao:corrigido     (teste de mutação sobre src/corrigido/)
 *
 *  As suítes "ilusão" e "realidade" mostram o problema. Esta mostra a saída.
 *  Cada bloco aqui existe para MATAR uma família de mutantes:
 *
 *   1. Toda guarda de contrato é exercitada (cada operando do || sozinho).
 *   2. Todo valor limite é testado nos três pontos: n-1, n, n+1.
 *   3. Todo erro é verificado por TIPO e por MENSAGEM exata.
 *   4. Todo retorno é comparado com o valor exato, nunca com toBeTruthy().
 *   5. Toda coleção é testada com zero, um e muitos itens.
 *   6. Toda função pura prova que não mutou a entrada.
 *
 *  Se você só puder levar uma coisa desta aula para o trabalho, leve esta lista.
 * ============================================================================
 */

const c01 = require('../../src/corrigido/01-tipos-inesperados');
const c02 = require('../../src/corrigido/02-condicoes-compostas');
const c03 = require('../../src/corrigido/03-valor-limite');
const c04 = require('../../src/corrigido/04-assercao-fraca');
const c05 = require('../../src/corrigido/05-efeito-colateral');
const c06 = require('../../src/corrigido/06-async');
const c07 = require('../../src/corrigido/07-loop-e-lista-vazia');
const c08 = require('../../src/corrigido/08-numeros-e-igualdade');
const c09 = require('../../src/corrigido/09-requisito-ausente');

const MSG_VALOR = 'valorBase deve ser um número finito >= 0';
const MSG_DESC = 'descontoPercentual deve ser um número entre 0 e 100';
const MSG_SOMA = 'somarDoacoes só aceita números finitos';
const MSG_MIN = 'minutosForaDoAr deve ser um número finito >= 0';

// ===========================================================================
describe('01 — guarda de tipo e de faixa', () => {
  describe('ehNumeroFinito', () => {
    it.each([
      [0, true],
      [-7, true],
      [3.14, true],
      [NaN, false],
      [Infinity, false],
      [-Infinity, false],
      ['5', false],
      [null, false],
      [undefined, false],
      [[], false],
      [{}, false],
      [true, false],
    ])('ehNumeroFinito(%p) === %p', (entrada, esperado) => {
      expect(c01.ehNumeroFinito(entrada)).toBe(esperado);
    });
  });

  describe('calcularInscricao — cada operando da guarda, sozinho', () => {
    it('recusa valorBase não numérico', () => {
      expect(() => c01.calcularInscricao('200', 10)).toThrow(new TypeError(MSG_VALOR));
      expect(() => c01.calcularInscricao(null, 10)).toThrow(TypeError);
      expect(() => c01.calcularInscricao(undefined, 10)).toThrow(TypeError);
      expect(() => c01.calcularInscricao(NaN, 10)).toThrow(TypeError);
      expect(() => c01.calcularInscricao([], 10)).toThrow(TypeError);
      expect(() => c01.calcularInscricao({}, 10)).toThrow(TypeError);
    });

    it('recusa valorBase negativo (o outro operando do mesmo ||)', () => {
      expect(() => c01.calcularInscricao(-1, 10)).toThrow(new TypeError(MSG_VALOR));
    });

    it('aceita valorBase igual a zero (a fronteira do >= 0)', () => {
      expect(c01.calcularInscricao(0, 10)).toBe(0);
    });

    it('recusa desconto não numérico', () => {
      expect(() => c01.calcularInscricao(200, '10')).toThrow(new RangeError(MSG_DESC));
      expect(() => c01.calcularInscricao(200, null)).toThrow(RangeError);
      expect(() => c01.calcularInscricao(200, undefined)).toThrow(RangeError);
    });

    it('recusa desconto abaixo de 0 e acima de 100', () => {
      expect(() => c01.calcularInscricao(200, -0.5)).toThrow(new RangeError(MSG_DESC));
      expect(() => c01.calcularInscricao(200, 100.5)).toThrow(new RangeError(MSG_DESC));
    });

    it('aceita as duas fronteiras do desconto: 0 e 100', () => {
      expect(c01.calcularInscricao(200, 0)).toBe(200);
      expect(c01.calcularInscricao(200, 100)).toBe(0);
    });

    it('calcula o valor exato dentro da faixa', () => {
      expect(c01.calcularInscricao(200, 10)).toBe(180);
      expect(c01.calcularInscricao(200, 25)).toBe(150);
      expect(c01.calcularInscricao(80, 50)).toBe(40);
    });
  });

  describe('somarDoacoes', () => {
    it('recusa cada lado inválido separadamente', () => {
      expect(() => c01.somarDoacoes('30', 20)).toThrow(new TypeError(MSG_SOMA));
      expect(() => c01.somarDoacoes(30, '20')).toThrow(new TypeError(MSG_SOMA));
      expect(() => c01.somarDoacoes(NaN, 20)).toThrow(TypeError);
      expect(() => c01.somarDoacoes(30, Infinity)).toThrow(TypeError);
    });

    it('soma (e não subtrai, nem concatena) dois números', () => {
      expect(c01.somarDoacoes(30, 20)).toBe(50);
      expect(c01.somarDoacoes(-5, 5)).toBe(0);
      expect(c01.somarDoacoes(0, 0)).toBe(0);
    });
  });
});

// ===========================================================================
describe('02 — tabela-verdade completa', () => {
  it.each([
    // idade, autorizou, jaEhVoluntario, esperado
    [30, true, false, true],
    [30, false, false, false],
    [12, true, false, false],
    [12, false, false, false],
    [30, true, true, true],
    [30, false, true, true],
    [12, true, true, true],
    [12, false, true, true],
  ])('podeInscrever(%p, %p, %p) === %p', (idade, aut, vol, esperado) => {
    expect(c02.podeInscrever(idade, aut, vol)).toBe(esperado);
  });

  it('a fronteira da idade é 16: 15 não, 16 sim, 17 sim', () => {
    expect(c02.podeInscrever(15, true, false)).toBe(false);
    expect(c02.podeInscrever(16, true, false)).toBe(true);
    expect(c02.podeInscrever(17, true, false)).toBe(true);
  });

  it('só o booleano true conta — valores "quase verdadeiros" não passam', () => {
    expect(c02.podeInscrever(30, 'sim', false)).toBe(false);
    expect(c02.podeInscrever(30, 1, false)).toBe(false);
    expect(c02.podeInscrever(12, 'sim', 'sim')).toBe(false);
  });
});

// ===========================================================================
describe('03 — as três fronteiras, nos três pontos', () => {
  it.each([
    [0, 'baixa'],
    [1, 'media'],
    [59, 'media'],
    [60, 'alta'],
    [61, 'alta'],
    [239, 'alta'],
    [240, 'critica'],
    [241, 'critica'],
    [10000, 'critica'],
  ])('classificarSeveridade(%p) === %p', (min, esperado) => {
    expect(c03.classificarSeveridade(min)).toBe(esperado);
  });

  it('recusa cada operando inválido da guarda, sozinho', () => {
    expect(() => c03.classificarSeveridade('60')).toThrow(new TypeError(MSG_MIN));  // não é number
    expect(() => c03.classificarSeveridade(NaN)).toThrow(new TypeError(MSG_MIN));   // não é finito
    expect(() => c03.classificarSeveridade(Infinity)).toThrow(new TypeError(MSG_MIN));
    expect(() => c03.classificarSeveridade(-1)).toThrow(new TypeError(MSG_MIN));    // negativo
    expect(() => c03.classificarSeveridade(null)).toThrow(TypeError);
    expect(() => c03.classificarSeveridade(undefined)).toThrow(TypeError);
  });
});

// ===========================================================================
describe('04 — string exata, não "toBeDefined"', () => {
  it('monta o protocolo no formato ANO-MES-DIA com as iniciais', () => {
    expect(c04.gerarProtocolo('Ana Paula Souza', new Date(2026, 2, 15)))
      .toBe('GRPV-20260315-APS');
  });

  it('preenche mês e dia com zero à esquerda', () => {
    expect(c04.gerarProtocolo('Bruno Lima', new Date(2026, 0, 5)))
      .toBe('GRPV-20260105-BL');
  });

  it('usa o último dia do ano sem virar o ano', () => {
    expect(c04.gerarProtocolo('Carla Dias', new Date(2026, 11, 31)))
      .toBe('GRPV-20261231-CD');
  });

  it('normaliza espaços extras e caixa do nome', () => {
    expect(c04.gerarProtocolo('  ana   paula  souza  ', new Date(2026, 2, 15)))
      .toBe('GRPV-20260315-APS');
  });

  it('funciona com nome de uma palavra só', () => {
    expect(c04.gerarProtocolo('Ana', new Date(2026, 2, 15))).toBe('GRPV-20260315-A');
  });

  it('recusa data inválida — cada operando da guarda', () => {
    expect(() => c04.gerarProtocolo('Ana', '2026-03-15'))
      .toThrow(new TypeError('data deve ser um Date válido'));
    expect(() => c04.gerarProtocolo('Ana', new Date('bananas')))
      .toThrow(new TypeError('data deve ser um Date válido'));
  });

  it('recusa nome inválido — cada operando da guarda', () => {
    expect(() => c04.gerarProtocolo(123, new Date(2026, 2, 15)))
      .toThrow(new TypeError('nome deve ser uma string não vazia'));
    expect(() => c04.gerarProtocolo('   ', new Date(2026, 2, 15)))
      .toThrow(new TypeError('nome deve ser uma string não vazia'));
  });
});

// ===========================================================================
describe('05 — pureza provada, não presumida', () => {
  it('ordena do maior para o menor, numericamente', () => {
    expect(c05.ordenarHoras([9, 10, 100])).toEqual([100, 10, 9]);
    expect(c05.ordenarHoras([1, 2, 3])).toEqual([3, 2, 1]);
  });

  it('não modifica o array recebido', () => {
    const original = [9, 10, 100];
    const copia = [...original];
    const saida = c05.ordenarHoras(original);
    expect(original).toEqual(copia);
    expect(saida).not.toBe(original);
    expect(saida).toHaveLength(3);
  });

  it('lida com zero, um e muitos', () => {
    expect(c05.ordenarHoras([])).toEqual([]);
    expect(c05.ordenarHoras([7])).toEqual([7]);
    expect(c05.ordenarHoras([2, 2, 1])).toEqual([2, 2, 1]);
  });

  it('recusa entrada que não é array', () => {
    expect(() => c05.ordenarHoras('123')).toThrow(new TypeError('horas deve ser um array'));
    expect(() => c05.ordenarHoras(null)).toThrow(TypeError);
  });

  it('totaliza sem guardar estado entre chamadas', () => {
    expect(c05.totalizarHoras([2, 3])).toBe(5);
    expect(c05.totalizarHoras([2, 3])).toBe(5);
    expect(c05.totalizarHoras([2, 3])).toBe(5);
  });

  it('totaliza zero, um e muitos', () => {
    expect(c05.totalizarHoras([])).toBe(0);
    expect(c05.totalizarHoras([4])).toBe(4);
    expect(c05.totalizarHoras([1, 2, 3, 4])).toBe(10);
  });

  it('recusa entrada que não é array', () => {
    expect(() => c05.totalizarHoras(10)).toThrow(new TypeError('lista deve ser um array'));
  });
});

// ===========================================================================
describe('06 — assíncrono verificado com await', () => {
  it('devolve os dados quando a API responde 200', async () => {
    const api = { get: jest.fn(async () => ({ status: 200, dados: { nome: 'Ana' } })) };
    await expect(c06.buscarVoluntario(7, api)).resolves.toEqual({ nome: 'Ana' });
  });

  it('chama a API na URL certa, uma única vez', async () => {
    const api = { get: jest.fn(async () => ({ status: 200, dados: {} })) };
    await c06.buscarVoluntario(42, api);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/voluntarios/42');
  });

  it('rejeita com erro nomeado e mensagem exata no 404', async () => {
    const api = { get: async () => ({ status: 404 }) };
    await expect(c06.buscarVoluntario(99, api))
      .rejects.toThrow(new c06.VoluntarioNaoEncontradoError(99));
    await expect(c06.buscarVoluntario(99, api))
      .rejects.toThrow('Voluntário 99 não encontrado');

    const erro = await c06.buscarVoluntario(99, api).catch((e) => e);
    expect(erro).toBeInstanceOf(c06.VoluntarioNaoEncontradoError);
    expect(erro.name).toBe('VoluntarioNaoEncontradoError');
    expect(erro.id).toBe(99);
  });

  it('rejeita com a mensagem genérica em qualquer outro status', async () => {
    const api500 = { get: async () => ({ status: 500 }) };
    await expect(c06.buscarVoluntario(1, api500))
      .rejects.toThrow('Falha ao buscar voluntário 1: HTTP 500');

    const api403 = { get: async () => ({ status: 403 }) };
    await expect(c06.buscarVoluntario(2, api403))
      .rejects.toThrow('Falha ao buscar voluntário 2: HTTP 403');
  });

  it('propaga a falha de rede em vez de engolir', async () => {
    const api = { get: async () => { throw new Error('ECONNREFUSED'); } };
    await expect(c06.buscarVoluntario(1, api)).rejects.toThrow('ECONNREFUSED');
  });
});

// ===========================================================================
describe('07 — coleção com zero, um e muitos', () => {
  it('devolve 0 para lista vazia', () => {
    expect(c07.mediaDeHoras([])).toBe(0);
  });

  it('devolve o próprio valor para lista de um item', () => {
    expect(c07.mediaDeHoras([10])).toBe(10);
    expect(c07.mediaDeHoras([0])).toBe(0);
  });

  it('inclui o primeiro e o último item na conta', () => {
    expect(c07.mediaDeHoras([6, 12])).toBe(9);
    expect(c07.mediaDeHoras([1, 2, 3, 4])).toBe(2.5);
    expect(c07.mediaDeHoras([5, 0, 0, 0])).toBe(1.25); // pega o primeiro
    expect(c07.mediaDeHoras([0, 0, 0, 8])).toBe(2);    // pega o último
  });

  it('recusa entrada que não é array', () => {
    expect(() => c07.mediaDeHoras(null)).toThrow(new TypeError('lista deve ser um array'));
    expect(() => c07.mediaDeHoras('10')).toThrow(TypeError);
  });
});

// ===========================================================================
describe('08 — dinheiro em centavos, comparação estrita', () => {
  it('fecha o caixa sem erro de ponto flutuante', () => {
    expect(c08.fecharCaixa([0.1, 0.2])).toBe(0.3);
    expect(c08.fecharCaixa([19.9, 0.1])).toBe(20);
    expect(c08.fecharCaixa([0.1, 0.2, 0.3])).toBe(0.6);
  });

  it('soma (e não subtrai) três ou mais valores', () => {
    expect(c08.fecharCaixa([10, 20, 30])).toBe(60);
    expect(c08.fecharCaixa([1, 2, 3, 4, 5])).toBe(15);
  });

  // Este bloco existe por causa de um bug ENCONTRADO por esta suíte:
  // a 1ª "correção" usava Math.round(d * 100) e devolvia 1.00 para 1.005.
  it('arredonda o centavo como a pessoa espera, mesmo nos valores traiçoeiros', () => {
    expect(c08.paraCentavos(1.005)).toBe(101);
    expect(c08.paraCentavos(2.675)).toBe(268);
    expect(c08.paraCentavos(0.1)).toBe(10);
    expect(c08.paraCentavos(0)).toBe(0);
    expect(c08.fecharCaixa([2.675])).toBe(2.68);
    // Cada item é arredondado antes de somar: 1,005 -> 1,01 duas vezes = 2,02.
    // Arredondar por item ou só no total é DECISÃO DE NEGÓCIO — este teste
    // registra qual das duas o código implementa hoje.
    expect(c08.fecharCaixa([1.005, 1.005])).toBe(2.02);
  });

  it('lida com zero, um e muitos', () => {
    expect(c08.fecharCaixa([])).toBe(0);
    expect(c08.fecharCaixa([12.34])).toBe(12.34);
  });

  it('recusa doação inválida com a mensagem que identifica o valor', () => {
    expect(() => c08.fecharCaixa([10, undefined])).toThrow('doação inválida: undefined');
    expect(() => c08.fecharCaixa([10, '20'])).toThrow('doação inválida: 20');
    expect(() => c08.fecharCaixa([NaN])).toThrow('doação inválida: NaN');
  });

  it('recusa entrada que não é array', () => {
    expect(() => c08.fecharCaixa(10)).toThrow(new TypeError('doacoes deve ser um array'));
  });

  it.each([
    ['BOLSA50', true],
    ['0', true],
    ['', false],
    ['   ', false],
    [0, false],
    [null, false],
    [undefined, false],
    [[], false],
  ])('temCupom(%p) === %p', (codigo, esperado) => {
    expect(c08.temCupom(codigo)).toBe(esperado);
  });

  it.each([
    [5, 5, true],
    [5, 6, false],
    [NaN, NaN, true],
    [0, -0, false],
    ['a', 'a', true],
    [null, undefined, false],
  ])('ehMesmoValor(%p, %p) === %p', (a, b, esperado) => {
    expect(c08.ehMesmoValor(a, b)).toBe(esperado);
  });
});

// ===========================================================================
describe('09 — o requisito que virou teste', () => {
  const novaTurma = () => ({ nome: 'QA 2026', vagas: 2, inscritos: [] });

  it('inscreve e devolve a mesma turma', () => {
    const turma = novaTurma();
    expect(c09.inscreverAluno(turma, { nome: 'Ana' })).toBe(turma);
    expect(turma.inscritos).toEqual([{ nome: 'Ana' }]);
  });

  it('aceita até a última vaga (fronteira: vagas - 1)', () => {
    const turma = novaTurma();
    c09.inscreverAluno(turma, { nome: 'Ana' });
    c09.inscreverAluno(turma, { nome: 'Bruno' });
    expect(turma.inscritos).toHaveLength(2);
  });

  it('recusa exatamente na vaga seguinte, com a mensagem certa', () => {
    const turma = novaTurma();
    c09.inscreverAluno(turma, { nome: 'Ana' });
    c09.inscreverAluno(turma, { nome: 'Bruno' });
    expect(() => c09.inscreverAluno(turma, { nome: 'Carla' }))
      .toThrow('Turma "QA 2026" já atingiu o limite de 2 vagas');
    expect(() => c09.inscreverAluno(turma, { nome: 'Carla' }))
      .toThrow(c09.TurmaLotadaError);
    expect(turma.inscritos).toHaveLength(2);
  });

  it('recusa turma sem vaga nenhuma desde a primeira inscrição', () => {
    const turma = { nome: 'Lotada', vagas: 0, inscritos: [] };
    expect(() => c09.inscreverAluno(turma, { nome: 'Ana' })).toThrow(c09.TurmaLotadaError);
  });

  it('recusa cada operando da guarda do aluno, sozinho', () => {
    const turma = novaTurma();
    expect(() => c09.inscreverAluno(turma, null)).toThrow('nome é obrigatório');
    expect(() => c09.inscreverAluno(turma, {})).toThrow('nome é obrigatório');
    expect(() => c09.inscreverAluno(turma, { nome: '' })).toThrow('nome é obrigatório');
    expect(turma.inscritos).toHaveLength(0);
  });

  it('o erro carrega nome e limite da turma na mensagem', () => {
    const turma = { nome: 'Turma B', vagas: 1, inscritos: [{ nome: 'X' }] };
    const erro = new c09.TurmaLotadaError(turma);
    expect(erro.name).toBe('TurmaLotadaError');
    expect(erro.message).toBe('Turma "Turma B" já atingiu o limite de 1 vagas');
  });
});
