/**
 * validators.js — Regras de validação de um bug report.
 *
 * Este módulo é COMPARTILHADO entre o frontend (navegador) e o backend (Node),
 * por isso usa o padrão UMD simplificado no final do arquivo.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const SEVERIDADES = ['baixa', 'media', 'alta', 'critica'];
const PRIORIDADES = ['baixa', 'media', 'alta'];
const STATUS_VALIDOS = ['aberto', 'em_analise', 'corrigido', 'fechado'];

const TAMANHO_MIN_TITULO = 5;
const TAMANHO_MIN_PASSOS = 10;

/**
 * Valida os dados de um bug report.
 * @param {object} bug - { titulo, passos, esperado, obtido, severidade, prioridade, status? }
 * @returns {{ valido: boolean, erros: string[] }}
 */
function validarBug(bug) {
  const erros = [];

  if (!bug || typeof bug !== 'object') {
    return { valido: false, erros: ['Bug report vazio ou inválido.'] };
  }

  const titulo = (bug.titulo || '').trim();
  const passos = (bug.passos || '').trim();
  const esperado = (bug.esperado || '').trim();
  const obtido = (bug.obtido || '').trim();

  if (titulo.length < TAMANHO_MIN_TITULO) {
    erros.push(`O título precisa ter pelo menos ${TAMANHO_MIN_TITULO} caracteres.`);
  }
  if (passos.length < TAMANHO_MIN_PASSOS) {
    erros.push(`Os passos para reproduzir precisam ter pelo menos ${TAMANHO_MIN_PASSOS} caracteres.`);
  }
  if (!esperado) {
    erros.push('Informe o resultado esperado.');
  }
  if (!obtido) {
    erros.push('Informe o resultado obtido.');
  }
  if (!SEVERIDADES.includes(bug.severidade)) {
    erros.push(`Severidade inválida. Use: ${SEVERIDADES.join(', ')}.`);
  }
  if (!PRIORIDADES.includes(bug.prioridade)) {
    erros.push(`Prioridade inválida. Use: ${PRIORIDADES.join(', ')}.`);
  }
  if (bug.status !== undefined && !STATUS_VALIDOS.includes(bug.status)) {
    erros.push(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}.`);
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Normaliza um bug antes de salvar (aplica padrões e remove espaços extras).
 */
function normalizarBug(bug) {
  return {
    titulo: (bug.titulo || '').trim(),
    prerequisitos: (bug.prerequisitos || '').trim(),
    passos: (bug.passos || '').trim(),
    esperado: (bug.esperado || '').trim(),
    obtido: (bug.obtido || '').trim(),
    severidade: bug.severidade,
    prioridade: bug.prioridade,
    status: bug.status || 'aberto',
    ambiente: (bug.ambiente || '').trim(),
    bdd: (bug.bdd || '').trim(),
    evidencia: bug.evidencia || null,
    evidenciaTipo: bug.evidenciaTipo || (bug.evidencia ? 'imagem' : null),
    evidenciaNome: bug.evidenciaNome || null
  };
}

// UMD simplificado: funciona no navegador (window) e no Node (module.exports)
const apiValidators = {
  validarBug,
  normalizarBug,
  SEVERIDADES,
  PRIORIDADES,
  STATUS_VALIDOS,
  TAMANHO_MIN_TITULO,
  TAMANHO_MIN_PASSOS
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiValidators;
}
if (typeof window !== 'undefined') {
  window.GarapuvuValidators = apiValidators;
}
