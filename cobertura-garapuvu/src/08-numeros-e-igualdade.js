/**
 * CASO 08 — Ponto flutuante, `==` e NaN
 * -------------------------------------
 * Três armadilhas do JavaScript que a cobertura nunca enxerga:
 *
 *   1) Dinheiro em float: 0.1 + 0.2 === 0.30000000000000004.
 *      Testar com 10 + 20 passa; testar com 0.1 + 0.2 quebra o fechamento do caixa.
 *   2) `==` faz coerção: '' == 0, '0' == 0, null == undefined, [] == false.
 *      Um cupom de valor '0' é tratado como "sem cupom".
 *   3) NaN não é igual a nada, nem a si mesmo. Uma soma contaminada por NaN
 *      se propaga em silêncio por todo o relatório.
 *
 * Cobertura: 100%.  Defeitos escondidos: 3.
 */

function fecharCaixa(doacoes) {
  let total = 0;
  for (const d of doacoes) {
    total += d;
  }
  return total;
}

function temCupom(codigo) {
  // BUG: `!=` com coerção. O código '0' e a string vazia se confundem.
  return codigo != 0;
}

function ehMesmoValor(a, b) {
  // BUG: com NaN dos dois lados devolve false; deveria considerar iguais.
  return a === b;
}

module.exports = { fecharCaixa, temCupom, ehMesmoValor };
