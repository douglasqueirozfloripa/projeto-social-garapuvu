/**
 * CASO 06 — versão corrigida
 * O erro é explícito. E o teste correspondente usa `await expect(...).rejects`,
 * que é o que realmente prova o comportamento assíncrono.
 */

class VoluntarioNaoEncontradoError extends Error {
  constructor(id) {
    super(`Voluntário ${id} não encontrado`);
    this.name = 'VoluntarioNaoEncontradoError';
    this.id = id;
  }
}

async function buscarVoluntario(id, api) {
  const resposta = await api.get(`/voluntarios/${id}`);
  if (resposta.status === 200) {
    return resposta.dados;
  }
  if (resposta.status === 404) {
    throw new VoluntarioNaoEncontradoError(id);
  }
  throw new Error(`Falha ao buscar voluntário ${id}: HTTP ${resposta.status}`);
}

module.exports = { buscarVoluntario, VoluntarioNaoEncontradoError };
