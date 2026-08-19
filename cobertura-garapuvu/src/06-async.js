/**
 * CASO 06 — Assíncrono: o teste que passa porque terminou antes do erro
 * ---------------------------------------------------------------------
 * Se o teste esquece o `await` (ou o `return`) da Promise, o Jest encerra
 * o caso antes da rejeição acontecer. A linha é contada como coberta,
 * o teste fica verde — e o erro só aparece em produção.
 *
 * Bug adicional: quando a API devolve 404, a função devolve `undefined`
 * em vez de lançar/tratar. Quem chama faz `.nome` e recebe
 * "Cannot read properties of undefined".
 */

async function buscarVoluntario(id, api) {
  const resposta = await api.get(`/voluntarios/${id}`);
  if (resposta.status === 200) {
    return resposta.dados;
  }
  // BUG: erro engolido. Nada é lançado, nada é logado, devolve undefined.
}

module.exports = { buscarVoluntario };
