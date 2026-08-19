/**
 * CASO 05 — versão corrigida
 * Cópia antes de ordenar (função pura), comparador numérico explícito
 * e acumulador local, sem estado de módulo.
 */

function ordenarHoras(horas) {
  if (!Array.isArray(horas)) {
    throw new TypeError('horas deve ser um array');
  }
  return [...horas].sort((a, b) => b - a);
}

function totalizarHoras(lista) {
  if (!Array.isArray(lista)) {
    throw new TypeError('lista deve ser um array');
  }
  let total = 0;
  for (const v of lista) {
    total += v;
  }
  return total;
}

module.exports = { ordenarHoras, totalizarHoras };
