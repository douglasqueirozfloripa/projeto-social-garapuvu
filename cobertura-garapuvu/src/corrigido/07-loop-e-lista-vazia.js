/**
 * CASO 07 — versão corrigida
 * Percorre todos os itens e trata explicitamente a coleção vazia.
 */

function mediaDeHoras(lista) {
  if (!Array.isArray(lista)) {
    throw new TypeError('lista deve ser um array');
  }
  if (lista.length === 0) {
    return 0;
  }
  let soma = 0;
  for (let i = 0; i < lista.length; i++) {
    soma += lista[i];
  }
  return soma / lista.length;
}

module.exports = { mediaDeHoras };
