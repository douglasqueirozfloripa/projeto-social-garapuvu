// regras.js — Regras de negócio puras do FreelaAvalia 360.
// São funções sem banco e sem Express: recebem dados e devolvem um resultado.
// Isso torna a lógica fácil de testar (testes unitários).

/**
 * Verifica se a nota é um inteiro válido de avaliação (1 a 5).
 * @param {number} nota - valor a validar.
 * @returns {boolean} true se for inteiro entre 1 e 5.
 */
export function validarNota(nota) {
  return Number.isInteger(nota) && nota >= 1 && nota <= 5;
}

/**
 * Valida o formato básico de um e-mail (algo@algo.dominio).
 * @param {string} email
 * @returns {boolean} true se o formato for válido.
 */
export function emailValido(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Calcula a média de uma lista de notas, com 1 casa decimal.
 * @param {number[]} lista - notas (ex.: [5, 4, 3]).
 * @returns {number} média arredondada a 1 casa; 0 se a lista for vazia.
 */
export function mediaAvaliacoes(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return 0;
  const soma = lista.reduce((acc, n) => acc + n, 0);
  return Math.round((soma / lista.length) * 10) / 10;
}

/**
 * Diz se um contrato já pode receber avaliações (feedback 360).
 * Permitido quando o trabalho está "em_andamento" (freelancer entrega e avalia;
 * contratante conclui e avalia) ou já "concluido".
 * @param {{status: string}} contrato
 * @returns {boolean}
 */
export function podeAvaliar(contrato) {
  return !!contrato && (contrato.status === "em_andamento" || contrato.status === "concluido");
}
