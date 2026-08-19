/**
 * CASO 01 — Tipo inesperado (o clássico do JavaScript)
 * ----------------------------------------------------
 * A função calcula o valor de uma inscrição com desconto de bolsista.
 *
 * O teste de "ilusão" só passa números. Como JavaScript não checa tipos em
 * tempo de execução, a função aceita string, null, undefined, array, objeto...
 * e devolve resultados silenciosamente errados — sem lançar erro nenhum.
 *
 * Cobertura de linha: 100%.  Defeitos escondidos: 4.
 */

function calcularInscricao(valorBase, descontoPercentual) {
  if (descontoPercentual > 0) {
    return valorBase - valorBase * (descontoPercentual / 100);
  }
  return valorBase;
}

/**
 * O mesmo problema, versão "concatenação sorrateira":
 * com números soma; com string concatena. Nenhum erro é lançado.
 */
function somarDoacoes(a, b) {
  return a + b;
}

module.exports = { calcularInscricao, somarDoacoes };
