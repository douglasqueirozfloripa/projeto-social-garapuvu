/**
 * CASO 05 — Efeito colateral e comparador ausente
 * ------------------------------------------------
 * `ordenarHoras` deveria devolver uma NOVA lista ordenada do maior para o menor.
 * Dois bugs escondidos atrás de 100% de cobertura:
 *
 *   1) `Array.prototype.sort()` sem comparador ordena como TEXTO.
 *      [9, 10, 100] vira ['10','100','9'] -> [10, 100, 9].
 *      Com a lista do teste (só números de 1 dígito) o resultado sai certo por sorte.
 *   2) `sort()` e `reverse()` ordenam NO LUGAR: o array de quem chamou é modificado.
 *      O teste não olha para a lista original, então nunca percebe.
 *
 * Cobertura: 100%.  Defeitos escondidos: 3.
 */

function ordenarHoras(horas) {
  return horas.sort().reverse();
}

/**
 * Mesma família de problema: acumula em uma variável de módulo.
 * Chamada duas vezes no mesmo processo, o total vem errado — mas o teste
 * unitário chama uma vez só e passa.
 */
let acumulado = 0;
function totalizarHoras(lista) {
  for (const v of lista) {
    acumulado += v;
  }
  return acumulado;
}

module.exports = { ordenarHoras, totalizarHoras };
