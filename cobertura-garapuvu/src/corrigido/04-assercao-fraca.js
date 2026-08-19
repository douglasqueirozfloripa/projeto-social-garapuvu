/**
 * CASO 04 — versão corrigida
 * Ordem correta ANO-MES-DIA. O que mudou de verdade não foi o código:
 * foi a ASSERÇÃO do teste, que agora compara a string exata esperada.
 */

function gerarProtocolo(nome, data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new TypeError('data deve ser um Date válido');
  }
  if (typeof nome !== 'string' || nome.trim() === '') {
    throw new TypeError('nome deve ser uma string não vazia');
  }
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  // O `.filter(Boolean)` deixa a intenção explícita: antes, os pedaços vazios
  // viravam `undefined` no map e sumiam por acidente no `join('')`.
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return `GRPV-${ano}${mes}${dia}-${iniciais}`;
}

module.exports = { gerarProtocolo };
