/**
 * ============================================================================
 *  SUÍTE "REALIDADE" — os testes que a suíte de 100% nunca escreveu
 * ============================================================================
 *  Rode:  npm run realidade
 *
 *  Cada bloco tem duas partes:
 *    🐛 PROVA DO BUG  — roda contra src/ (código bugado) e demonstra o defeito.
 *    ✅ CORRIGIDO     — roda contra src/corrigido/ e mostra o comportamento certo.
 *
 *  Tudo aqui fica VERDE. Isso é de propósito: a suíte não "quebra o projeto",
 *  ela documenta o defeito e a correção lado a lado, para você comparar em aula.
 * ============================================================================
 */

const bug01 = require('../../src/01-tipos-inesperados');
const ok01 = require('../../src/corrigido/01-tipos-inesperados');
const bug02 = require('../../src/02-condicoes-compostas');
const ok02 = require('../../src/corrigido/02-condicoes-compostas');
const bug03 = require('../../src/03-valor-limite');
const ok03 = require('../../src/corrigido/03-valor-limite');
const bug04 = require('../../src/04-assercao-fraca');
const ok04 = require('../../src/corrigido/04-assercao-fraca');
const bug05 = require('../../src/05-efeito-colateral');
const ok05 = require('../../src/corrigido/05-efeito-colateral');
const bug06 = require('../../src/06-async');
const ok06 = require('../../src/corrigido/06-async');
const bug07 = require('../../src/07-loop-e-lista-vazia');
const ok07 = require('../../src/corrigido/07-loop-e-lista-vazia');
const bug08 = require('../../src/08-numeros-e-igualdade');
const ok08 = require('../../src/corrigido/08-numeros-e-igualdade');
const bug09 = require('../../src/09-requisito-ausente');
const ok09 = require('../../src/corrigido/09-requisito-ausente');

// ---------------------------------------------------------------------------
describe('01 — tipo inesperado: JavaScript não checa nada por você', () => {
  it('🐛 string no lugar de número devolve um valor errado, sem erro', () => {
    // '200' - '200' * 0.1 => 200 - 20 => 180 ... aqui funciona por coerção.
    // Mas sem desconto a função devolve a STRING '200', não o número 200:
    expect(bug01.calcularInscricao('200', 0)).toBe('200');
    expect(typeof bug01.calcularInscricao('200', 0)).toBe('string');
  });

  it('🐛 null vira 0 e undefined vira NaN — os dois em silêncio', () => {
    expect(bug01.calcularInscricao(null, 10)).toBe(0);
    expect(bug01.calcularInscricao(undefined, 10)).toBeNaN();
  });

  it('🐛 array e objeto também passam batido', () => {
    expect(bug01.calcularInscricao([], 10)).toBe(0);
    expect(bug01.calcularInscricao({}, 10)).toBeNaN();
  });

  it('🐛 desconto negativo devolve o valor cheio; acima de 100 devolve negativo', () => {
    expect(bug01.calcularInscricao(200, -50)).toBe(200);
    expect(bug01.calcularInscricao(200, 150)).toBe(-100);
  });

  it('🐛 somarDoacoes concatena quando recebe string', () => {
    expect(bug01.somarDoacoes('30', 20)).toBe('3020');
    expect(bug01.somarDoacoes(30, '20')).toBe('3020');
  });

  it('✅ a versão corrigida rejeita a entrada inválida', () => {
    expect(() => ok01.calcularInscricao('200', 0)).toThrow(TypeError);
    expect(() => ok01.calcularInscricao(null, 10)).toThrow(TypeError);
    expect(() => ok01.calcularInscricao(200, 150)).toThrow(RangeError);
    expect(() => ok01.somarDoacoes('30', 20)).toThrow(TypeError);
    expect(ok01.calcularInscricao(200, 10)).toBe(180);
  });
});

// ---------------------------------------------------------------------------
describe('02 — cobertura de decisão não é cobertura de condição', () => {
  it('🐛 menor de 16 SEM autorização entra só por ter marcado a caixinha errada', () => {
    // Regra: precisa ter 16+ E autorização. O `||` deixa passar qualquer um dos dois.
    expect(bug02.podeInscrever(12, true, false)).toBe(true);
  });

  it('🐛 adulto que NÃO autorizou o uso de imagem também entra', () => {
    expect(bug02.podeInscrever(30, false, false)).toBe(true);
  });

  it('✅ a versão corrigida exige as duas condições', () => {
    expect(ok02.podeInscrever(12, true, false)).toBe(false);
    expect(ok02.podeInscrever(30, false, false)).toBe(false);
    expect(ok02.podeInscrever(30, true, false)).toBe(true);
    expect(ok02.podeInscrever(12, false, true)).toBe(true); // voluntário cadastrado
  });
});

// ---------------------------------------------------------------------------
describe('03 — o defeito mora exatamente na fronteira', () => {
  it('🐛 240 minutos deveria ser crítica, mas volta como alta', () => {
    expect(bug03.classificarSeveridade(240)).toBe('alta');
  });

  it('🐛 60 minutos deveria ser alta, mas volta como média', () => {
    expect(bug03.classificarSeveridade(60)).toBe('media');
  });

  it('🐛 valor negativo é classificado como baixa em vez de recusado', () => {
    expect(bug03.classificarSeveridade(-10)).toBe('baixa');
  });

  it('✅ a versão corrigida acerta as fronteiras', () => {
    expect(ok03.classificarSeveridade(239)).toBe('alta');
    expect(ok03.classificarSeveridade(240)).toBe('critica');
    expect(ok03.classificarSeveridade(59)).toBe('media');
    expect(ok03.classificarSeveridade(60)).toBe('alta');
    expect(ok03.classificarSeveridade(0)).toBe('baixa');
    expect(() => ok03.classificarSeveridade(-10)).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
describe('04 — sem oráculo forte, o teste só faz cócegas', () => {
  it('🐛 o protocolo sai com mês e dia trocados', () => {
    // 15/03/2026 deveria virar GRPV-20260315-APS
    expect(bug04.gerarProtocolo('Ana Paula Souza', new Date(2026, 2, 15)))
      .toBe('GRPV-20261503-APS');
  });

  it('✅ a versão corrigida bate com a string exata esperada', () => {
    expect(ok04.gerarProtocolo('Ana Paula Souza', new Date(2026, 2, 15)))
      .toBe('GRPV-20260315-APS');
  });
});

// ---------------------------------------------------------------------------
describe('05 — a função mexeu no que era do chamador', () => {
  it('🐛 ordena como texto: 10 e 100 ficam na frente do 9', () => {
    expect(bug05.ordenarHoras([9, 10, 100])).toEqual([9, 100, 10]);
  });

  it('🐛 o array original de quem chamou foi modificado', () => {
    const original = [3, 1, 8];
    bug05.ordenarHoras(original);
    expect(original).not.toEqual([3, 1, 8]); // o dado de entrada foi destruído
  });

  it('🐛 chamar duas vezes acumula o total da chamada anterior', () => {
    expect(bug05.totalizarHoras([2, 3])).toBe(5);
    expect(bug05.totalizarHoras([2, 3])).toBe(10); // deveria ser 5 de novo
  });

  it('✅ a versão corrigida é pura: não muta e não guarda estado', () => {
    const original = [9, 10, 100];
    expect(ok05.ordenarHoras(original)).toEqual([100, 10, 9]);
    expect(original).toEqual([9, 10, 100]);
    expect(ok05.totalizarHoras([2, 3])).toBe(5);
    expect(ok05.totalizarHoras([2, 3])).toBe(5);
  });
});

// ---------------------------------------------------------------------------
describe('06 — assíncrono: com await a verdade aparece', () => {
  it('🐛 404 devolve undefined em vez de avisar que deu errado', async () => {
    const api = { get: async () => ({ status: 404 }) };
    await expect(bug06.buscarVoluntario(99, api)).resolves.toBeUndefined();
  });

  it('🐛 quem chama quebra ao usar o resultado', async () => {
    const api = { get: async () => ({ status: 404 }) };
    const v = await bug06.buscarVoluntario(99, api);
    expect(() => v.nome).toThrow(TypeError);
  });

  it('✅ a versão corrigida rejeita com um erro nomeado', async () => {
    const api = { get: async () => ({ status: 404 }) };
    await expect(ok06.buscarVoluntario(99, api))
      .rejects.toThrow(ok06.VoluntarioNaoEncontradoError);

    const api500 = { get: async () => ({ status: 500 }) };
    await expect(ok06.buscarVoluntario(1, api500)).rejects.toThrow('HTTP 500');
  });
});

// ---------------------------------------------------------------------------
describe('07 — loop: zero, um e muitos', () => {
  it('🐛 lista vazia devolve NaN em vez de 0', () => {
    expect(bug07.mediaDeHoras([])).toBeNaN();
  });

  it('🐛 o último item nunca entra na conta', () => {
    expect(bug07.mediaDeHoras([6, 12])).toBe(3); // a média real é 9
    expect(bug07.mediaDeHoras([10])).toBe(0); // a média real é 10
  });

  it('✅ a versão corrigida trata vazio, um e muitos', () => {
    expect(ok07.mediaDeHoras([])).toBe(0);
    expect(ok07.mediaDeHoras([10])).toBe(10);
    expect(ok07.mediaDeHoras([6, 12])).toBe(9);
    expect(ok07.mediaDeHoras([1, 2, 3, 4])).toBe(2.5);
  });
});

// ---------------------------------------------------------------------------
describe('08 — ponto flutuante, coerção e NaN', () => {
  it('🐛 o caixa não fecha: 0.1 + 0.2 não dá 0.3', () => {
    expect(bug08.fecharCaixa([0.1, 0.2])).not.toBe(0.3);
    expect(bug08.fecharCaixa([0.1, 0.2])).toBeCloseTo(0.3, 10);
  });

  it('🐛 uma doação inválida contamina o relatório inteiro com NaN', () => {
    expect(bug08.fecharCaixa([10, undefined, 20])).toBeNaN();
  });

  it('🐛 o cupom "0" e a string vazia são tratados como ausência de cupom', () => {
    expect(bug08.temCupom('0')).toBe(false);
    expect(bug08.temCupom('')).toBe(false);
    expect(bug08.temCupom([])).toBe(false);
  });

  it('🐛 NaN nunca é igual a NaN', () => {
    expect(bug08.ehMesmoValor(NaN, NaN)).toBe(false);
  });

  it('✅ a versão corrigida usa centavos, comparação estrita e Object.is', () => {
    expect(ok08.fecharCaixa([0.1, 0.2])).toBe(0.3);
    expect(ok08.fecharCaixa([19.9, 0.1])).toBe(20);
    expect(() => ok08.fecharCaixa([10, undefined])).toThrow(TypeError);
    expect(ok08.temCupom('0')).toBe(true);
    expect(ok08.temCupom('')).toBe(false);
    expect(ok08.ehMesmoValor(NaN, NaN)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('09 — o requisito que nunca virou código', () => {
  it('🐛 a turma estoura o limite de vagas sem nenhum aviso', () => {
    const turma = { nome: 'QA 2026', vagas: 2, inscritos: [] };
    bug09.inscreverAluno(turma, { nome: 'Ana' });
    bug09.inscreverAluno(turma, { nome: 'Bruno' });
    bug09.inscreverAluno(turma, { nome: 'Carla' });
    expect(turma.inscritos).toHaveLength(3); // vagas: 2
  });

  it('✅ a versão corrigida recusa a terceira inscrição', () => {
    const turma = { nome: 'QA 2026', vagas: 2, inscritos: [] };
    ok09.inscreverAluno(turma, { nome: 'Ana' });
    ok09.inscreverAluno(turma, { nome: 'Bruno' });
    expect(() => ok09.inscreverAluno(turma, { nome: 'Carla' }))
      .toThrow(ok09.TurmaLotadaError);
    expect(turma.inscritos).toHaveLength(2);
  });
});
