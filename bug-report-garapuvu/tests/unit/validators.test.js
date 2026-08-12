/**
 * Testes UNITÁRIOS — validators.js
 * Testam as regras de validação de forma isolada (sem API, sem navegador).
 */

const {
  validarBug,
  normalizarBug,
  SEVERIDADES,
  PRIORIDADES,
  STATUS_VALIDOS
} = require('../../frontend/js/validators.js');

function bugValido(extras = {}) {
  return {
    titulo: 'Botão de login não responde',
    passos: '1. Abrir a página. 2. Clicar em Entrar.',
    esperado: 'Usuário autenticado',
    obtido: 'Nada acontece',
    severidade: 'alta',
    prioridade: 'alta',
    ...extras
  };
}

describe('validarBug', () => {
  test('aceita um bug completo e válido', () => {
    const resultado = validarBug(bugValido());
    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
  });

  test('rejeita bug nulo ou não-objeto', () => {
    expect(validarBug(null).valido).toBe(false);
    expect(validarBug(undefined).valido).toBe(false);
    expect(validarBug('texto').valido).toBe(false);
  });

  test('rejeita título curto demais (menos de 5 caracteres)', () => {
    const resultado = validarBug(bugValido({ titulo: 'Bug' }));
    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toMatch(/título/i);
  });

  test('rejeita título feito só de espaços', () => {
    const resultado = validarBug(bugValido({ titulo: '        ' }));
    expect(resultado.valido).toBe(false);
  });

  test('rejeita passos curtos demais (menos de 10 caracteres)', () => {
    const resultado = validarBug(bugValido({ passos: 'clico' }));
    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toMatch(/passos/i);
  });

  test('exige resultado esperado e obtido', () => {
    const semEsperado = validarBug(bugValido({ esperado: '' }));
    const semObtido = validarBug(bugValido({ obtido: '' }));
    expect(semEsperado.valido).toBe(false);
    expect(semObtido.valido).toBe(false);
  });

  test.each(SEVERIDADES)('aceita severidade válida: %s', (severidade) => {
    expect(validarBug(bugValido({ severidade })).valido).toBe(true);
  });

  test('rejeita severidade inventada', () => {
    const resultado = validarBug(bugValido({ severidade: 'apocaliptica' }));
    expect(resultado.valido).toBe(false);
    expect(resultado.erros.join(' ')).toMatch(/severidade/i);
  });

  test.each(PRIORIDADES)('aceita prioridade válida: %s', (prioridade) => {
    expect(validarBug(bugValido({ prioridade })).valido).toBe(true);
  });

  test('rejeita prioridade inválida', () => {
    expect(validarBug(bugValido({ prioridade: 'urgentíssima' })).valido).toBe(false);
  });

  test.each(STATUS_VALIDOS)('aceita status válido: %s', (status) => {
    expect(validarBug(bugValido({ status })).valido).toBe(true);
  });

  test('rejeita status inválido', () => {
    expect(validarBug(bugValido({ status: 'sumiu' })).valido).toBe(false);
  });

  test('acumula múltiplos erros de uma vez', () => {
    const resultado = validarBug({});
    expect(resultado.valido).toBe(false);
    expect(resultado.erros.length).toBeGreaterThanOrEqual(5);
  });
});

describe('normalizarBug', () => {
  test('remove espaços das pontas dos campos de texto', () => {
    const bug = normalizarBug(bugValido({ titulo: '  Título com espaços  ' }));
    expect(bug.titulo).toBe('Título com espaços');
  });

  test('aplica status padrão "aberto" quando não informado', () => {
    const bug = normalizarBug(bugValido());
    expect(bug.status).toBe('aberto');
  });

  test('mantém o status quando informado', () => {
    const bug = normalizarBug(bugValido({ status: 'corrigido' }));
    expect(bug.status).toBe('corrigido');
  });

  test('evidência ausente vira null', () => {
    const bug = normalizarBug(bugValido());
    expect(bug.evidencia).toBeNull();
  });
});
