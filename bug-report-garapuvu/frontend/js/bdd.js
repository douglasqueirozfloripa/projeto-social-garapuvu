/**
 * bdd.js — Converte um bug report em cenário BDD (Gherkin em português).
 *
 * Regra de tradução:
 *   pré-requisitos → Dado que / E
 *   passos         → Quando / E
 *   esperado       → Então
 *   obtido         → comentário (é o desvio, não a asserção)
 *
 * É uma função pura, então roda igual no navegador e no Node (ver UMD no final).
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

// Marcadores de lista que a pessoa costuma digitar: "1.", "2)", "-", "*", "•"
const MARCADOR_LISTA = /^\s*(?:\d+\s*[.)\-:]|[-*•‣–])\s*/;

// Palavras-chave Gherkin já digitadas: removidas para não duplicar ("Quando Quando…")
const PALAVRAS_GHERKIN = /^(dado que|dado|quando|então|entao|mas|e|given|when|then|and|but)\s+/i;

const INDENTACAO = '    ';

/**
 * Limpa uma linha: tira numeração, bullets e palavras-chave Gherkin repetidas.
 * @param {string} linha
 * @returns {string}
 */
function limparLinha(linha) {
  return String(linha == null ? '' : linha)
    .replace(MARCADOR_LISTA, '')
    .replace(PALAVRAS_GHERKIN, '')
    .trim();
}

/**
 * Quebra um texto multilinha em linhas limpas, descartando as vazias.
 * @param {string} texto
 * @returns {string[]}
 */
function emLinhas(texto) {
  return String(texto == null ? '' : texto)
    .split(/\r?\n/)
    .map(limparLinha)
    .filter((linha) => linha.length > 0);
}

/**
 * Monta um bloco Gherkin: a primeira linha recebe a palavra-chave, as outras "E".
 * @param {string[]} linhas
 * @param {string} palavraChave - "Dado que" ou "Quando"
 * @returns {string[]}
 */
function bloco(linhas, palavraChave) {
  return linhas.map(
    (linha, indice) => `${INDENTACAO}${indice === 0 ? palavraChave : 'E'} ${linha}`
  );
}

/**
 * Gera o cenário BDD a partir dos campos do bug.
 * @param {object} bug - { titulo, prerequisitos, passos, esperado, obtido, severidade, prioridade, ambiente }
 * @returns {string} cenário em Gherkin (pt-BR)
 */
function gerarBdd(bug) {
  const dados = bug && typeof bug === 'object' ? bug : {};

  const titulo = String(dados.titulo || '').trim() || 'Cenário sem título';
  const prerequisitos = emLinhas(dados.prerequisitos);
  const passos = emLinhas(dados.passos);
  const esperado = limparLinha(dados.esperado);
  const obtido = limparLinha(dados.obtido);
  const ambiente = String(dados.ambiente || '').trim();

  const etiquetas = ['@bug'];
  if (dados.severidade) etiquetas.push(`@sev-${dados.severidade}`);
  if (dados.prioridade) etiquetas.push(`@prio-${dados.prioridade}`);

  const linhas = ['# language: pt', `Funcionalidade: ${titulo}`, ''];

  if (ambiente) linhas.push(`  # Ambiente: ${ambiente}`);
  linhas.push(`  ${etiquetas.join(' ')}`);
  linhas.push(`  Cenário: ${titulo}`);

  if (prerequisitos.length > 0) {
    linhas.push(...bloco(prerequisitos, 'Dado que'));
  }

  if (passos.length > 0) {
    linhas.push(...bloco(passos, 'Quando'));
  } else {
    linhas.push(`${INDENTACAO}# TODO: descreva os passos para reproduzir`);
  }

  if (esperado) {
    linhas.push(`${INDENTACAO}Então ${esperado}`);
  } else {
    linhas.push(`${INDENTACAO}# TODO: descreva o resultado esperado`);
  }

  if (obtido) {
    linhas.push('');
    linhas.push(`${INDENTACAO}# ⚠️ Resultado obtido hoje (bug): ${obtido}`);
  }

  return linhas.join('\n');
}

// UMD simplificado: funciona no navegador (window) e no Node (module.exports)
const apiBdd = { gerarBdd, limparLinha, emLinhas };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiBdd;
}
if (typeof window !== 'undefined') {
  window.GarapuvuBdd = apiBdd;
}
