/**
 * csv.js — Exporta a lista de bugs para CSV (RFC 4180).
 *
 * Cuidados que o teste unitário cobre:
 *   - campos com ; " ou quebra de linha são envolvidos em aspas duplas;
 *   - aspas internas são duplicadas ("" ), como manda o RFC;
 *   - separador ";" e BOM UTF-8, para o Excel pt-BR abrir sem quebrar acentos.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

const SEPARADOR = ';';
const FIM_LINHA = '\r\n';
const BOM = '﻿';

// Ordem das colunas no arquivo exportado
const COLUNAS = [
  { chave: 'id', rotulo: 'ID' },
  { chave: 'titulo', rotulo: 'Titulo' },
  { chave: 'status', rotulo: 'Status' },
  { chave: 'severidade', rotulo: 'Severidade' },
  { chave: 'prioridade', rotulo: 'Prioridade' },
  { chave: 'prerequisitos', rotulo: 'Pre-requisitos' },
  { chave: 'passos', rotulo: 'Passos para reproduzir' },
  { chave: 'esperado', rotulo: 'Resultado esperado' },
  { chave: 'obtido', rotulo: 'Resultado obtido' },
  { chave: 'ambiente', rotulo: 'Ambiente' },
  { chave: 'bdd', rotulo: 'Cenario BDD' },
  { chave: 'criadoEm', rotulo: 'Criado em' },
  { chave: 'evidencia', rotulo: 'Evidencia' }
];

/**
 * Escapa um valor para uma célula CSV.
 * @param {*} valor
 * @returns {string}
 */
function escaparCampo(valor) {
  if (valor === null || valor === undefined) return '';

  const texto = String(valor);
  const precisaAspas = /[";\n\r]/.test(texto);

  return precisaAspas ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/**
 * Converte um bug em uma linha (array de células já escapadas).
 * @param {object} bug
 * @returns {string}
 */
function linhaDoBug(bug) {
  const dados = bug && typeof bug === 'object' ? bug : {};

  return COLUNAS.map(({ chave }) => {
    // O dataURL da evidência é enorme e inútil na planilha: vira um resumo
    if (chave === 'evidencia') {
      if (!dados.evidencia) return escaparCampo('sem evidencia');
      const tipo = dados.evidenciaTipo === 'video' ? 'video' : 'imagem';
      return escaparCampo(dados.evidenciaNome ? `${tipo}: ${dados.evidenciaNome}` : tipo);
    }
    return escaparCampo(dados[chave]);
  }).join(SEPARADOR);
}

/**
 * Gera o conteúdo CSV completo (com cabeçalho e BOM).
 * @param {object[]} bugs
 * @returns {string}
 */
function gerarCsv(bugs) {
  const lista = Array.isArray(bugs) ? bugs : [];
  const cabecalho = COLUNAS.map(({ rotulo }) => escaparCampo(rotulo)).join(SEPARADOR);
  const linhas = [cabecalho, ...lista.map(linhaDoBug)];

  return BOM + linhas.join(FIM_LINHA) + FIM_LINHA;
}

/**
 * Nome de arquivo com data/hora, no padrão dos demais artefatos do projeto.
 * @param {Date} data
 * @returns {string} ex.: bugs-garapuvu-2026-08-12_16-40-05.csv
 */
function nomeArquivoCsv(data) {
  const d = data instanceof Date && !Number.isNaN(data.getTime()) ? data : new Date();
  const dois = (n) => String(n).padStart(2, '0');

  const dia = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  const hora = `${dois(d.getHours())}-${dois(d.getMinutes())}-${dois(d.getSeconds())}`;

  return `bugs-garapuvu-${dia}_${hora}.csv`;
}

const apiCsv = { gerarCsv, escaparCampo, nomeArquivoCsv, COLUNAS, SEPARADOR };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiCsv;
}
if (typeof window !== 'undefined') {
  window.GarapuvuCsv = apiCsv;
}
