/**
 * CASO 04 — Asserção fraca (o teste que executa, mas não verifica nada)
 * ---------------------------------------------------------------------
 * Cobertura mede LINHA EXECUTADA. Ela não sabe se você olhou o resultado.
 * Um teste com `expect(x).toBeDefined()` cobre 100% e não prova nada:
 * é o que a literatura chama de "teste sem oráculo".
 *
 * Aqui o formatador de protocolo devolve o mês e o dia trocados.
 * Qualquer asserção fraca (toBeDefined, toBeTruthy, "não lançou erro")
 * passa feliz da vida.
 *
 * Cobertura: 100%.  Verificação real: 0%.
 */

function gerarProtocolo(nome, data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  // BUG: a ordem combinada é ANO-MES-DIA; aqui mês e dia estão trocados.
  return `GRPV-${ano}${dia}${mes}-${iniciais}`;
}

module.exports = { gerarProtocolo };
