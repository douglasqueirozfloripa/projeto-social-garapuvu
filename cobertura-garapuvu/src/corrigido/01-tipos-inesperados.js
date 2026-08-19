/**
 * CASO 01 — versão corrigida
 * A correção é uma "guarda de contrato": validar o tipo e a faixa ANTES de calcular.
 * Em vez de devolver lixo em silêncio, a função falha alto e cedo.
 */

/**
 * `Number.isFinite` NÃO faz coerção: já devolve false para '5', true, null,
 * undefined, [] e {}. O `typeof v === 'number'` que existia aqui era redundante —
 * quem apontou isso foi o teste de mutação, não a cobertura.
 */
function ehNumeroFinito(v) {
  return Number.isFinite(v);
}

function calcularInscricao(valorBase, descontoPercentual) {
  if (!ehNumeroFinito(valorBase) || valorBase < 0) {
    throw new TypeError('valorBase deve ser um número finito >= 0');
  }
  if (!ehNumeroFinito(descontoPercentual) || descontoPercentual < 0 || descontoPercentual > 100) {
    throw new RangeError('descontoPercentual deve ser um número entre 0 e 100');
  }
  // O `if (descontoPercentual > 0)` que existia aqui era um atalho inútil:
  // com desconto 0 a conta já devolve valorBase. Ramo a menos = teste a menos.
  return valorBase - valorBase * (descontoPercentual / 100);
}

function somarDoacoes(a, b) {
  if (!ehNumeroFinito(a) || !ehNumeroFinito(b)) {
    throw new TypeError('somarDoacoes só aceita números finitos');
  }
  return a + b;
}

module.exports = { calcularInscricao, somarDoacoes, ehNumeroFinito };
